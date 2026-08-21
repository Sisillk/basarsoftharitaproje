import { useEffect, useRef, useState } from 'react'

import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import OSM from 'ol/source/OSM.js'
import VectorSource from 'ol/source/Vector.js'
import TileWMS from 'ol/source/TileWMS.js'
import Draw from 'ol/interaction/Draw.js'
import Modify from 'ol/interaction/Modify.js'
import Collection from 'ol/Collection.js'
import WKT from 'ol/format/WKT.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { fromLonLat } from 'ol/proj.js'

import Style from 'ol/style/Style.js'
import Stroke from 'ol/style/Stroke.js'
import Fill from 'ol/style/Fill.js'
import CircleStyle from 'ol/style/Circle.js'

import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Toast } from 'primereact/toast'

import 'ol/ol.css'

const API_URL = 'http://localhost:5092/api/geometry'
const AUTH_URL = 'http://localhost:5092/api/authorization'

const GEOSERVER_WMS_URL =
  'http://localhost:8080/geoserver/basarsoft/wms'

const GEOSERVER_API_URL =
  'http://localhost:5092/api/geoserver'


const getUserIdFromToken = (jwtToken) => {
  try {
    if (!jwtToken) return null

    const payloadPart =
      jwtToken.split('.')[1]

    if (!payloadPart) return null

    const normalized =
      payloadPart
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const padded =
      normalized.padEnd(
        normalized.length +
          ((4 - normalized.length % 4) % 4),
        '='
      )

    const payload =
      JSON.parse(
        atob(padded)
      )

    const rawUserId =
      payload.sub ??
      payload.nameid ??
      payload.userId ??
      payload.user_id ??
      payload[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ]

    const parsed =
      Number(rawUserId)

    return Number.isFinite(parsed)
      ? parsed
      : null
  } catch (error) {
    console.error(
      'JWT kullanıcı id okunamadı:',
      error
    )

    return null
  }
}


function MapPage({ token, onLogout, onOpenAdmin }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const vectorSourceRef = useRef(null)
  const analysisSourceRef = useRef(null)
  const drawRef = useRef(null)
  const modifyRef = useRef(null)
  const originalGeometryRef = useRef(null)
  const toastRef = useRef(null)
  const vectorLayerRef = useRef(null)

  const wmsLayerRefs = useRef({
    point: null,
    line: null,
    polygon: null,
  })

  const heatmapLayerRef = useRef(null)

  const layerVisibilityRef = useRef({
    point: true,
    line: true,
    polygon: true,
  })

  const [selectedType, setSelectedType] = useState(null)
  const [drawingToolsOpen, setDrawingToolsOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [remainingTime, setRemainingTime] = useState(0)

  const [popupVisible, setPopupVisible] = useState(false)
  const [pendingFeature, setPendingFeature] = useState(null)
  const [pendingType, setPendingType] = useState(null)
  const [geometryName, setGeometryName] = useState('')
  const [geometryColor, setGeometryColor] = useState('#ff1744')
  const [saving, setSaving] = useState(false)

  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [detailName, setDetailName] = useState('')
  const [detailColor, setDetailColor] = useState('#ff1744')
  const [detailSaving, setDetailSaving] = useState(false)
  const [geometryEditing, setGeometryEditing] = useState(false)

  const [permissionNames, setPermissionNames] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)

  const [currentUserId, setCurrentUserId] =
    useState(() =>
      getUserIdFromToken(
        token ||
        localStorage.getItem('token')
      )
    )

  const [layerVisibility, setLayerVisibility] = useState({
    point: true,
    line: true,
    polygon: true,
  })

  const [layerDialogVisible, setLayerDialogVisible] =
    useState(false)

  const [geometryCounts, setGeometryCounts] = useState({
    point: 0,
    line: 0,
    polygon: 0,
  })

  const [heatmapVisible, setHeatmapVisible] =
    useState(false)

  const hasPermission = (permissionName) => {
    return permissionNames.includes(permissionName)
  }

  const showToast = (
    severity,
    summary,
    detail
  ) => {
    toastRef.current?.show({
      severity,
      summary,
      detail,
      life: 3000,
    })
  }

  const refreshGeometryCounts = () => {
    const source =
      vectorSourceRef.current

    if (!source) {
      setGeometryCounts({
        point: 0,
        line: 0,
        polygon: 0,
      })

      return
    }

    const nextCounts = {
      point: 0,
      line: 0,
      polygon: 0,
    }

    source
      .getFeatures()
      .forEach((feature) => {
        const id =
          feature.get('id')

        const type =
          feature.get('type')

        if (!id || !type) {
          return
        }

        if (
          Object.prototype.hasOwnProperty.call(
            nextCounts,
            type
          )
        ) {
          nextCounts[type] += 1
        }
      })

    setGeometryCounts(
      nextCounts
    )
  }


  const toggleLayerVisibility =
    (type) => {
      setLayerVisibility(
        (previous) => {
          const next = {
            ...previous,
            [type]:
              !previous[type],
          }

          layerVisibilityRef.current =
            next

          wmsLayerRefs.current[
            type
          ]?.setVisible(
            next[type]
          )

          vectorLayerRef.current
            ?.changed()

          return next
        }
      )
    }


  const refreshWmsLayers = () => {
    const cacheBuster =
      Date.now()

    Object.values(
      wmsLayerRefs.current
    ).forEach((layer) => {
      const source =
        layer?.getSource()

      if (!source) {
        return
      }

      source.updateParams({
        _v: cacheBuster,
      })

      source.refresh()
    })

    const heatmapSource =
      heatmapLayerRef.current
        ?.getSource()

    if (heatmapSource) {
      heatmapSource.updateParams({
        _v: cacheBuster,
      })

      heatmapSource.refresh()
    }
  }


  const toggleHeatmap = () => {
    const layer =
      heatmapLayerRef.current

    if (!layer) {
      return
    }

    setHeatmapVisible(
      previous => {
        const next =
          !previous

        layer.setVisible(
          next
        )

        if (next) {
          const source =
            layer.getSource()

          source?.updateParams({
            _v: Date.now(),
          })

          source?.refresh()

          showToast(
            'info',
            'Isı Haritası',
            'Isı haritası analizi açıldı.'
          )
        } else {
          showToast(
            'info',
            'Isı Haritası',
            'Isı haritası analizi kapatıldı.'
          )
        }

        return next
      }
    )
  }


  const showAllLayers = () => {
    const next = {
      point: true,
      line: true,
      polygon: true,
    }

    layerVisibilityRef.current =
      next

    setLayerVisibility(
      next
    )

    Object.values(
      wmsLayerRefs.current
    ).forEach((layer) => {
      layer?.setVisible(true)
    })

    vectorLayerRef.current
      ?.changed()

    showToast(
      'success',
      'Katmanlar',
      'Tüm katmanlar görünür yapıldı.'
    )
  }


  const undoLastDrawPoint = () => {
    const draw =
      drawRef.current

    if (!draw) {
      showToast(
        'info',
        'Geri Al',
        'Şu anda aktif bir çizim yok.'
      )

      return
    }

    if (
      selectedType === 'point'
    ) {
      showToast(
        'info',
        'Geri Al',
        'Nokta çiziminde geri alınacak köşe bulunmuyor.'
      )

      return
    }

    if (
      typeof draw.removeLastPoint ===
      'function'
    ) {
      draw.removeLastPoint()

      showToast(
        'info',
        'Geri Al',
        'Son çizim noktası geri alındı.'
      )
    }
  }


  const createGeometryStyle = (feature) => {
    const geometry = feature.getGeometry()

    if (!geometry) return null

    const type = geometry.getType()
    const color = feature.get('color') || '#ff1744'

    const interactionOnly =
      Boolean(
        feature.get('id')
      ) &&
      feature.get(
        'interactionVisible'
      ) !== true

    const savedType =
      feature.get('type')

    const visibilityKey =
      savedType ||
      (
        type === 'Point'
          ? 'point'
          : type === 'LineString'
            ? 'line'
            : type === 'Polygon'
              ? 'polygon'
              : null
      )

    if (
      visibilityKey &&
      layerVisibilityRef.current[
        visibilityKey
      ] === false
    ) {
      return null
    }

    // WFS feature'ları normal görünümde sadece etkileşim verisi olarak tutulur.
    // Görsel gösterimi WMS yapar. Düzenleme açıldığında interactionVisible=true olur
    // ve feature tekrar görünür hale gelir.
    if (interactionOnly) {
      return null
    }

    if (type === 'Point') {
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({
            color,
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2,
          }),
        }),
      })
    }

    if (type === 'LineString') {
      return new Style({
        stroke: new Stroke({
          color,
          width: 5,
        }),
      })
    }

    if (type === 'Polygon') {
      return new Style({
        stroke: new Stroke({
          color,
          width: 4,
        }),
        fill: new Fill({
          color: `${color}33`,
        }),
      })
    }

    return null
  }

  const analysisStyle = new Style({
    stroke: new Stroke({
      color: '#ff9800',
      width: 4,
      lineDash: [10, 8],
    }),
    fill: new Fill({
      color: 'rgba(255, 152, 0, 0.18)',
    }),
  })

  const removeCurrentDrawInteraction = () => {
    const map = mapRef.current

    if (map && drawRef.current) {
      map.removeInteraction(drawRef.current)
      drawRef.current = null
    }
  }

  const removeModifyInteraction = () => {
    const map = mapRef.current

    if (map && modifyRef.current) {
      map.removeInteraction(modifyRef.current)
      modifyRef.current = null
    }

    setGeometryEditing(false)
  }

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const vectorSource =
      new VectorSource()

    const analysisSource =
      new VectorSource()

    vectorSourceRef.current =
      vectorSource

    analysisSourceRef.current =
      analysisSource

    const vectorLayer =
      new VectorLayer({
        source: vectorSource,
        style: createGeometryStyle,
        zIndex: 20,
      })

    vectorLayerRef.current =
      vectorLayer

    const updateGeometryCounts =
      () => {
        const nextCounts = {
          point: 0,
          line: 0,
          polygon: 0,
        }

        vectorSource
          .getFeatures()
          .forEach((feature) => {
            const id =
              feature.get('id')

            const type =
              feature.get('type')

            if (
              id &&
              type &&
              Object.prototype
                .hasOwnProperty.call(
                  nextCounts,
                  type
                )
            ) {
              nextCounts[
                type
              ] += 1
            }
          })

        setGeometryCounts(
          nextCounts
        )
      }

    vectorSource.on(
      'addfeature',
      updateGeometryCounts
    )

    vectorSource.on(
      'removefeature',
      updateGeometryCounts
    )

    vectorSource.on(
      'changefeature',
      updateGeometryCounts
    )

    const cqlFilter =
      `inserted_user_id=${currentUserId}`

    const createWmsLayer =
      (
        layerName,
        type,
        zIndex,
        styleName = ''
      ) => {
        const layer =
          new TileLayer({
            source:
              new TileWMS({
                url:
                  GEOSERVER_WMS_URL,

                params: {
                  LAYERS:
                    `basarsoft:${layerName}`,

                  FORMAT:
                    'image/png',

                  TRANSPARENT:
                    true,

                  STYLES:
                    styleName,

                  TILED:
                    false,

                  cql_filter:
                    cqlFilter,

                  _v:
                    Date.now(),
                },

                serverType:
                  'geoserver',

                transition: 0,
              }),

            visible:
              layerVisibilityRef
                .current[type],

            zIndex,
          })

        wmsLayerRefs.current[
          type
        ] = layer

        return layer
      }

    const polygonWmsLayer =
      createWmsLayer(
        'vw_polygon_active',
        'polygon',
        5,
        'polygon_dynamic'
      )

    const lineWmsLayer =
      createWmsLayer(
        'vw_line_active',
        'line',
        6,
        'line_dynamic'
      )

    const pointWmsLayer =
      createWmsLayer(
        'vw_point_active',
        'point',
        7,
        'point_dynamic'
      )

    const heatmapWmsLayer =
      new TileLayer({
        source:
          new TileWMS({
            url:
              GEOSERVER_WMS_URL,

            params: {
              LAYERS:
                'basarsoft:vw_point_active',

              STYLES:
                'heatmap_dynamic',

              FORMAT:
                'image/png',

              TRANSPARENT:
                true,

              TILED:
                false,

              cql_filter:
                cqlFilter,

              _v:
                Date.now(),
            },

            serverType:
              'geoserver',

            transition: 0,
          }),

        visible: false,
        zIndex: 8,
      })

    heatmapLayerRef.current =
      heatmapWmsLayer

    const analysisLayer =
      new VectorLayer({
        source: analysisSource,
        style: analysisStyle,
        zIndex: 30,
      })

    const map =
      new Map({
        target:
          mapElementRef.current,

        layers: [
          new TileLayer({
            source:
              new OSM(),
            zIndex: 0,
          }),

          polygonWmsLayer,
          lineWmsLayer,
          pointWmsLayer,
          heatmapWmsLayer,

          vectorLayer,
          analysisLayer,
        ],

        view: new View({
          center:
            fromLonLat([
              35.24,
              38.96,
            ]),

          zoom: 5.5,
        }),
      })

    mapRef.current =
      map

    const loadWfsGeometries =
      async () => {
        const layerConfigs = [
          {
            endpoint:
              'points',
            layer:
              'vw_point_active',
            type: 'point',
          },
          {
            endpoint:
              'lines',
            layer:
              'vw_line_active',
            type: 'line',
          },
          {
            endpoint:
              'polygons',
            layer:
              'vw_polygon_active',
            type: 'polygon',
          },
        ]

        const geoJsonFormat =
          new GeoJSON()

        vectorSource.clear()

        for (
          const config
          of layerConfigs
        ) {
          const response =
            await fetch(
              `${GEOSERVER_API_URL}/${config.endpoint}?userId=${currentUserId}`
            )

          if (!response.ok) {
            throw new Error(
              `${config.layer} WFS verisi backend üzerinden alınamadı.`
            )
          }

          const data =
            await response.json()

          const features =
            geoJsonFormat
              .readFeatures(
                data,
                {
                  dataProjection:
                    'EPSG:4326',

                  featureProjection:
                    'EPSG:3857',
                }
              )

          features.forEach(
            (feature) => {
              const featureId =
                String(
                  feature.getId() ||
                  ''
                )

              const match =
                featureId.match(
                  /\.(\d+)$/
                )

              const dbId =
                Number(
                  feature.get('id') ||
                  (
                    match
                      ? match[1]
                      : 0
                  )
                )

              feature.set(
                'id',
                dbId
              )

              feature.set(
                'type',
                config.type
              )

              feature.set(
                'name',
                feature.get(
                  'name'
                ) || ''
              )

              feature.set(
                'color',
                feature.get(
                  'color'
                ) ||
                '#ff1744'
              )

              feature.set(
                'interactionVisible',
                false
              )

              vectorSource
                .addFeature(
                  feature
                )
            }
          )
        }

        updateGeometryCounts()
      }

    loadWfsGeometries()
      .catch((error) => {
        console.error(
          'GeoServer WFS yükleme hatası:',
          error
        )

        showToast(
          'error',
          'GeoServer',
          'WFS verileri backend üzerinden yüklenemedi. Backend ve GeoServer çalışıyor mu kontrol et.'
        )
      })

    const handleMapClick =
      (event) => {
        if (
          drawRef.current ||
          modifyRef.current
        ) {
          return
        }

        const coordinate =
          event.coordinate

        const resolution =
          map
            .getView()
            .getResolution() || 1

        // Yaklaşık 12 piksellik tıklama toleransı.
        const maxDistance =
          resolution * 12

        let feature = null
        let bestDistance =
          Number.POSITIVE_INFINITY

        vectorSource
          .getFeatures()
          .forEach(
            (candidate) => {
              const id =
                candidate.get('id')

              const type =
                candidate.get('type')

              if (
                !id ||
                !type ||
                layerVisibilityRef
                  .current[type] === false
              ) {
                return
              }

              const geometry =
                candidate
                  .getGeometry()

              if (!geometry) {
                return
              }

              // Polygon içine tıklanırsa mesafe 0 kabul edilir.
              if (
                typeof geometry
                  .intersectsCoordinate ===
                  'function' &&
                geometry
                  .intersectsCoordinate(
                    coordinate
                  )
              ) {
                if (
                  0 <
                  bestDistance
                ) {
                  feature =
                    candidate

                  bestDistance = 0
                }

                return
              }

              const closest =
                geometry
                  .getClosestPoint(
                    coordinate
                  )

              const dx =
                closest[0] -
                coordinate[0]

              const dy =
                closest[1] -
                coordinate[1]

              const distance =
                Math.sqrt(
                  dx * dx +
                  dy * dy
                )

              if (
                distance <=
                  maxDistance &&
                distance <
                  bestDistance
              ) {
                feature =
                  candidate

                bestDistance =
                  distance
              }
            }
          )

        if (!feature) {
          return
        }

        originalGeometryRef.current =
          feature
            .getGeometry()
            .clone()

        setSelectedFeature(
          feature
        )

        setDetailName(
          feature.get(
            'name'
          ) || ''
        )

        setDetailColor(
          feature.get(
            'color'
          ) ||
          '#ff1744'
        )

        setDetailVisible(
          true
        )

        setMessage('')
      }

    map.on(
      'singleclick',
      handleMapClick
    )

    return () => {
      map.un(
        'singleclick',
        handleMapClick
      )

      if (
        drawRef.current
      ) {
        map.removeInteraction(
          drawRef.current
        )
      }

      if (
        modifyRef.current
      ) {
        map.removeInteraction(
          modifyRef.current
        )
      }

      vectorSource.un(
        'addfeature',
        updateGeometryCounts
      )

      vectorSource.un(
        'removefeature',
        updateGeometryCounts
      )

      vectorSource.un(
        'changefeature',
        updateGeometryCounts
      )

      map.setTarget(
        undefined
      )

      mapRef.current = null
      vectorLayerRef.current =
        null

      wmsLayerRefs.current = {
        point: null,
        line: null,
        polygon: null,
      }

      heatmapLayerRef.current =
        null
    }
  }, [
    currentUserId,
    onLogout,
  ])


  useEffect(() => {
    if (!token) return

    const loadAuthorization = async () => {
      try {
        const response = await fetch(
          'http://localhost:5092/api/authorization/me',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.status === 401) {
          onLogout()
          return
        }

        if (!response.ok) {
          throw new Error(
            'Yetki bilgileri alınamadı.'
          )
        }

        const data = await response.json()

        setPermissionNames(
          data.permissionNames || []
        )

        setIsAdmin(
          data.isAdmin || false
        )

        const authorizationUserId =
          Number(
            data.userId ||
            data.user_id
          )

        if (
          Number.isFinite(
            authorizationUserId
          ) &&
          authorizationUserId > 0
        ) {
          setCurrentUserId(
            authorizationUserId
          )
        }
      } catch (error) {
        console.error(
          'Yetki bilgileri alınamadı:',
          error
        )
      }
    }

    loadAuthorization()
  }, [token, onLogout])

  useEffect(() => {
    const updateTimer = () => {
      const expiration =
        Number(
          localStorage.getItem(
            'expiration'
          )
        )

      const difference =
        expiration - Date.now()

      if (difference <= 0) {
        setRemainingTime(0)
        return
      }

      setRemainingTime(
        Math.ceil(
          difference / 1000
        )
      )
    }

    updateTimer()

    const timer =
      setInterval(
        updateTimer,
        1000
      )

    return () =>
      clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const minutes =
      Math.floor(
        seconds / 60
      )

    const secs =
      seconds % 60

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(secs).padStart(
      2,
      '0'
    )}`
  }

  const goToTurkey = () => {
    const map = mapRef.current

    if (!map) {
      return
    }

    removeCurrentDrawInteraction()
    removeModifyInteraction()

    map.getView().animate({
      center: fromLonLat([
        35.24,
        38.96,
      ]),
      zoom: 5.5,
      duration: 500,
    })

    setSelectedType(null)

    showToast(
      'info',
      'Harita',
      'Türkiye görünümüne dönüldü.'
    )
  }


  const checkGeometryAuthorization =
    async (feature) => {
      const wktFormat =
        new WKT()

      const wkt =
        wktFormat.writeFeature(
          feature,
          {
            featureProjection:
              'EPSG:3857',

            dataProjection:
              'EPSG:4326',
          }
        )

      const currentToken =
        localStorage.getItem(
          'token'
        ) || token

      const response =
        await fetch(
          `${AUTH_URL}/check-geometry`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${currentToken}`,
            },

            body:
              JSON.stringify({
                wkt,
              }),
          }
        )

      if (
        response.status === 401
      ) {
        onLogout()
        return false
      }

      const data =
        await response
          .json()
          .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Coğrafi yetki kontrolü yapılamadı.'
        )
      }

      return data.allowed === true
    }


  const startDrawing = (type) => {
    const map =
      mapRef.current

    if (
      !map ||
      !vectorSourceRef.current
    ) {
      return
    }

    removeCurrentDrawInteraction()
    removeModifyInteraction()

    setMessage('')
    setSelectedType(type)

    if (
      type === 'point' ||
      type === 'line' ||
      type === 'polygon'
    ) {
      setLayerVisibility(
        (previous) => {
          if (previous[type]) {
            return previous
          }

          const next = {
            ...previous,
            [type]: true,
          }

          layerVisibilityRef.current =
            next

          wmsLayerRefs.current[
            type
          ]?.setVisible(true)

          vectorLayerRef.current
            ?.changed()

          return next
        }
      )
    }

    let geometryType

    if (type === 'point') {
      geometryType = 'Point'
    } else if (type === 'line') {
      geometryType =
        'LineString'
    } else if (type === 'polygon') {
      geometryType =
        'Polygon'
    } else {
      return
    }

    const draw =
      new Draw({
        source:
          vectorSourceRef.current,

        type:
          geometryType,
      })

    drawRef.current =
      draw

    map.addInteraction(
      draw
    )

    draw.on(
      'drawend',
      async (event) => {
        const drawnFeature =
          event.feature

        try {
          const allowed =
            await checkGeometryAuthorization(
              drawnFeature
            )

          if (!allowed) {
            vectorSourceRef.current
              ?.removeFeature(
                drawnFeature
              )

            const geoMessage =
              'Bu alan coğrafi yetki sınırlarınızın dışında. Buraya çizim yapamazsınız.'

            setMessage(
              geoMessage
            )

            showToast(
              'error',
              'Coğrafi Yetki',
              geoMessage
            )

            setPopupVisible(false)
            setPendingFeature(null)
            setPendingType(null)

            removeCurrentDrawInteraction()
            setSelectedType(null)

            return
          }

          setPendingFeature(
            drawnFeature
          )

          setPendingType(
            type
          )

          setGeometryName('')
          setGeometryColor(
            '#ff1744'
          )

          setPopupVisible(
            true
          )
        } catch (error) {
          console.error(error)

          vectorSourceRef.current
            ?.removeFeature(
              drawnFeature
            )

          const geoErrorMessage =
            error.message ||
            'Coğrafi yetki kontrolü yapılamadı.'

          setMessage(
            geoErrorMessage
          )

          showToast(
            'error',
            'Coğrafi Yetki',
            geoErrorMessage
          )

          setPopupVisible(false)
          setPendingFeature(null)
          setPendingType(null)
        } finally {
          removeCurrentDrawInteraction()
          setSelectedType(null)
        }
      }
    )
  }

  const getInventoryCount =
    async (feature) => {
      const wktFormat =
        new WKT()

      const wkt =
        wktFormat.writeFeature(
          feature,
          {
            featureProjection:
              'EPSG:3857',

            dataProjection:
              'EPSG:4326',
          }
        )

      const token =
        localStorage.getItem(
          'token'
        )

      const response =
        await fetch(
          `${API_URL}/inventory-count`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                wkt,
                name: '',
                color: '',
              }),
          }
        )

      if (
        response.status === 401
      ) {
        onLogout()
        return null
      }

      if (!response.ok) {
        throw new Error(
          'Envanter analizi başarısız.'
        )
      }

      const data =
        await response.json()

      return data.count
    }

  const savePendingGeometry =
    async () => {
      if (
        !pendingFeature ||
        !pendingType
      ) {
        return
      }

      if (
        !geometryName.trim()
      ) {
        setMessage(
          'İsim alanı boş bırakılamaz.'
        )

        return
      }

      setSaving(true)
      setMessage('')

      try {
        const wktFormat =
          new WKT()

        const wkt =
          wktFormat.writeFeature(
            pendingFeature,
            {
              featureProjection:
                'EPSG:3857',

              dataProjection:
                'EPSG:4326',
            }
          )

        const token =
          localStorage.getItem(
            'token'
          )

        const response =
          await fetch(
            `${API_URL}/${pendingType}`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  wkt,

                  name:
                    geometryName.trim(),

                  color:
                    geometryColor,
                }),
            }
          )

        if (
          response.status === 401
        ) {
          onLogout()
          return
        }

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Kayıt başarısız.'
          )
        }

        pendingFeature.set(
          'id',
          data.id
        )

        pendingFeature.set(
          'type',
          pendingType
        )

        pendingFeature.set(
          'name',
          geometryName.trim()
        )

        pendingFeature.set(
          'color',
          geometryColor
        )

        pendingFeature.set(
          'interactionVisible',
          false
        )

        pendingFeature.changed()

        refreshGeometryCounts()
        refreshWmsLayers()

        if (
          pendingType === 'point'
        ) {
          setMessage(
            'Nokta başarıyla kaydedildi.'
          )

          showToast(
            'success',
            'Başarılı',
            'Nokta başarıyla kaydedildi.'
          )
        } else if (
          pendingType === 'line'
        ) {
          setMessage(
            'Çizgi başarıyla kaydedildi.'
          )

          showToast(
            'success',
            'Başarılı',
            'Çizgi başarıyla kaydedildi.'
          )
        } else if (
          pendingType ===
          'polygon'
        ) {
          try {
            const count =
              await getInventoryCount(
                pendingFeature
              )

            if (
              count !== null
            ) {
              const polygonMessage =
                `Poligon kaydedildi. ${count} envanter ile kesişiyor.`

              setMessage(
                polygonMessage
              )

              showToast(
                'success',
                'Başarılı',
                polygonMessage
              )
            }
          } catch (
            analysisError
          ) {
            console.error(
              analysisError
            )

            const polygonWarning =
              'Poligon kaydedildi fakat envanter analizi yapılamadı.'

            setMessage(
              polygonWarning
            )

            showToast(
              'warn',
              'Uyarı',
              polygonWarning
            )
          }
        }

        setPopupVisible(
          false
        )

        setPendingFeature(
          null
        )

        setPendingType(
          null
        )

        setGeometryName('')
        setGeometryColor(
          '#ff1744'
        )
      } catch (error) {
        console.error(error)

        const saveErrorMessage =
          error.message ||
          'Çizim veritabanına kaydedilemedi.'

        setMessage(
          saveErrorMessage
        )

        showToast(
          'error',
          'Kayıt Hatası',
          saveErrorMessage
        )
      } finally {
        setSaving(false)
      }
    }

  const cancelPopup = () => {
    if (
      pendingFeature &&
      vectorSourceRef.current
    ) {
      vectorSourceRef.current
        .removeFeature(
          pendingFeature
        )
    }

    setPopupVisible(false)
    setPendingFeature(null)
    setPendingType(null)
    setGeometryName('')
    setGeometryColor(
      '#ff1744'
    )
    setMessage('')
  }

  const startInventoryAnalysis =
    () => {
      const map =
        mapRef.current

      const analysisSource =
        analysisSourceRef.current

      if (
        !map ||
        !analysisSource
      ) {
        return
      }

      removeCurrentDrawInteraction()
      removeModifyInteraction()

      analysisSource.clear()

      setSelectedType(
        'analysis'
      )

      setMessage(
        'Analiz poligonunu çizin.'
      )

      const draw =
        new Draw({
          source:
            analysisSource,

          type:
            'Polygon',
        })

      drawRef.current =
        draw

      map.addInteraction(
        draw
      )

      draw.on(
        'drawend',
        async (event) => {
          try {
            const count =
              await getInventoryCount(
                event.feature
              )

            if (
              count !== null
            ) {
              const analysisMessage =
                `Envanter Analizi: ${count} envanter ile kesişiyor.`

              setMessage(
                analysisMessage
              )

              showToast(
                'info',
                'Envanter Analizi',
                analysisMessage
              )
            }
          } catch (error) {
            console.error(error)

            setMessage(
              'Envanter analizi yapılamadı.'
            )

            showToast(
              'error',
              'Analiz Hatası',
              'Envanter analizi yapılamadı.'
            )
          }

          removeCurrentDrawInteraction()

          setSelectedType(
            null
          )
        }
      )
    }

  const clearInventoryAnalysis =
    () => {
      removeCurrentDrawInteraction()

      if (
        analysisSourceRef.current
      ) {
        analysisSourceRef.current
          .clear()
      }

      setSelectedType(null)

      setMessage(
        'Analiz poligonu temizlendi.'
      )
    }

  const stopDrawing = () => {
    if (
      drawRef.current &&
      mapRef.current
    ) {
      mapRef.current
        .removeInteraction(
          drawRef.current
        )

      drawRef.current =
        null
    }

    setSelectedType(null)

    setMessage(
      'Çizim modu durduruldu.'
    )

    showToast(
      'info',
      'Çizim',
      'Çizim modu durduruldu.'
    )
  }

  const startGeometryEdit =
    () => {
      const map =
        mapRef.current

      if (
        !map ||
        !selectedFeature
      ) {
        return
      }

      removeCurrentDrawInteraction()
      removeModifyInteraction()

      selectedFeature.set(
        'interactionVisible',
        true
      )

      selectedFeature.changed()

      const modify =
        new Modify({
          features:
            new Collection([
              selectedFeature,
            ]),
        })

      modifyRef.current =
        modify

      map.addInteraction(
        modify
      )

      setGeometryEditing(
        true
      )

      setMessage(
        'Haritadaki obje üzerinde nokta veya köşeleri sürükleyebilirsin.'
      )
    }

  const cancelDetail = () => {
    if (
      selectedFeature &&
      originalGeometryRef.current
    ) {
      selectedFeature.setGeometry(
        originalGeometryRef.current
          .clone()
      )

      selectedFeature.set(
        'interactionVisible',
        false
      )

      selectedFeature.changed()
    }

    removeModifyInteraction()

    originalGeometryRef.current =
      null

    setSelectedFeature(null)
    setDetailVisible(false)
    setDetailName('')
    setDetailColor(
      '#ff1744'
    )
    setMessage('')
  }

  const saveDetail =
    async () => {
      if (!selectedFeature) {
        return
      }

      if (
        !detailName.trim()
      ) {
        setMessage(
          'İsim alanı boş bırakılamaz.'
        )

        return
      }

      setDetailSaving(true)
      setMessage('')

      try {
        const id =
          selectedFeature.get(
            'id'
          )

        const type =
          selectedFeature.get(
            'type'
          )

        const token =
          localStorage.getItem(
            'token'
          )

        const wktFormat =
          new WKT()

        const wkt =
          wktFormat.writeFeature(
            selectedFeature,
            {
              featureProjection:
                'EPSG:3857',

              dataProjection:
                'EPSG:4326',
            }
          )

        const geoAllowed =
          await checkGeometryAuthorization(
            selectedFeature
          )

        if (!geoAllowed) {
          if (
            originalGeometryRef.current
          ) {
            selectedFeature.setGeometry(
              originalGeometryRef.current
                .clone()
            )

            selectedFeature.set(
              'interactionVisible',
              false
            )

            selectedFeature.changed()
          }

          removeModifyInteraction()

          const updateGeoMessage =
            'Bu geometri coğrafi yetki sınırlarınızın dışında. Güncelleme yapılamaz.'

          setMessage(
            updateGeoMessage
          )

          showToast(
            'error',
            'Coğrafi Yetki',
            updateGeoMessage
          )

          return
        }

        const response =
          await fetch(
            `${API_URL}/${type}/${id}`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  wkt,

                  name:
                    detailName.trim(),

                  color:
                    detailColor,
                }),
            }
          )

        if (
          response.status === 401
        ) {
          onLogout()
          return
        }

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Güncelleme başarısız.'
          )
        }

        selectedFeature.set(
          'name',
          detailName.trim()
        )

        selectedFeature.set(
          'color',
          detailColor
        )

        selectedFeature.set(
          'interactionVisible',
          false
        )

        selectedFeature.changed()

        refreshWmsLayers()

        removeModifyInteraction()

        originalGeometryRef.current =
          null

        setSelectedFeature(
          null
        )

        setDetailVisible(
          false
        )

        setMessage(
          'Obje başarıyla güncellendi.'
        )

        showToast(
          'success',
          'Başarılı',
          'Obje başarıyla güncellendi.'
        )
      } catch (error) {
        console.error(error)

        const updateErrorMessage =
          error.message ||
          'Obje güncellenemedi.'

        setMessage(
          updateErrorMessage
        )

        showToast(
          'error',
          'Güncelleme Hatası',
          updateErrorMessage
        )
      } finally {
        setDetailSaving(false)
      }
    }

  const deleteSelectedFeature =
    async () => {
      if (!selectedFeature) {
        return
      }

      const confirmed =
        window.confirm(
          'Bu objeyi silmek istediğine emin misin? Kayıt veritabanından tamamen silinmeyecek.'
        )

      if (!confirmed) {
        return
      }

      setDetailSaving(true)
      setMessage('')

      try {
        const id =
          selectedFeature.get(
            'id'
          )

        const type =
          selectedFeature.get(
            'type'
          )

        const token =
          localStorage.getItem(
            'token'
          )

        const response =
          await fetch(
            `${API_URL}/${type}/${id}`,
            {
              method:
                'DELETE',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          )

        if (
          response.status === 401
        ) {
          onLogout()
          return
        }

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Silme işlemi başarısız.'
          )
        }

        removeModifyInteraction()

        if (
          vectorSourceRef.current
        ) {
          vectorSourceRef.current
            .removeFeature(
              selectedFeature
            )
        }

        originalGeometryRef.current =
          null

        setSelectedFeature(
          null
        )

        setDetailVisible(
          false
        )

        refreshGeometryCounts()
        refreshWmsLayers()

        setMessage(
          'Obje başarıyla silindi.'
        )

        showToast(
          'success',
          'Başarılı',
          'Obje başarıyla silindi.'
        )
      } catch (error) {
        console.error(error)

        const deleteErrorMessage =
          error.message ||
          'Obje silinemedi.'

        setMessage(
          deleteErrorMessage
        )

        showToast(
          'error',
          'Silme Hatası',
          deleteErrorMessage
        )
      } finally {
        setDetailSaving(
          false
        )
      }
    }

  const popupFooter = (
    <div className="popup-footer">
      <Button
        label="İptal"
        icon="pi pi-times"
        severity="secondary"
        onClick={cancelPopup}
        disabled={saving}
      />

      <Button
        label={
          saving
            ? 'Kaydediliyor...'
            : 'Kaydet'
        }
        icon="pi pi-check"
        onClick={
          savePendingGeometry
        }
        disabled={saving}
      />
    </div>
  )

  const detailFooter = (
    <div
      className="popup-footer"
      style={{
        justifyContent:
          'space-between',
      }}
    >
      <div>
        {hasPermission(
          'Obje Silme'
        ) && (
          <Button
            label="Sil"
            icon="pi pi-trash"
            severity="danger"
            onClick={
              deleteSelectedFeature
            }
            disabled={
              detailSaving
            }
          />
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
        }}
      >
        <Button
          label="İptal"
          icon="pi pi-times"
          severity="secondary"
          onClick={
            cancelDetail
          }
          disabled={
            detailSaving
          }
        />

        {hasPermission(
          'Obje Güncelleme'
        ) && (
          <Button
            label={
              detailSaving
                ? 'Kaydediliyor...'
                : 'Kaydet'
            }
            icon="pi pi-check"
            onClick={
              saveDetail
            }
            disabled={
              detailSaving
            }
          />
        )}
      </div>
    </div>
  )

  return (
    <div className="map-page">
      <Toast
        ref={toastRef}
        position="top-right"
      />

      <header>
        <h2>
          Türkiye Haritası
        </h2>

        <div className="header-actions">
          <div className="session-timer">
            Oturum Süresi:{' '}
            {formatTime(
              remainingTime
            )}
          </div>

          <Button
            label="Çıkış Yap"
            icon="pi pi-sign-out"
            onClick={onLogout}
          />
        </div>
      </header>

      <div
        style={{
          position: 'absolute',
          top: '82px',
          left: '22px',
          zIndex: 1000,
        }}
      >
        {!drawingToolsOpen ? (
          <Button
            label="Çizim Araçları"
            icon="pi pi-chevron-down"
            onClick={() =>
              setDrawingToolsOpen(
                true
              )
            }
            style={{
              borderRadius: '10px',
              fontWeight: 700,
              boxShadow:
                '0 6px 18px rgba(0, 0, 0, 0.18)',
            }}
          />
        ) : (
          <div
            className="drawing-toolbar"
            style={{
              position: 'relative',
              top: 'auto',
              left: 'auto',
              right: 'auto',
              margin: 0,
              width: 'auto',
              maxWidth:
                'calc(100vw - 44px)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              padding: '10px 12px',
              paddingRight: '48px',
              borderRadius: '12px',
              boxShadow:
                '0 8px 24px rgba(0, 0, 0, 0.22)',
            }}
          >
        {hasPermission(
          'Point Ekleme'
        ) && (
          <Button
            label="Nokta"
            icon="pi pi-map-marker"
            className={
              selectedType ===
              'point'
                ? 'drawing-active'
                : ''
            }
            onClick={() =>
              startDrawing(
                'point'
              )
            }
          />
        )}

        {hasPermission(
          'Line Ekleme'
        ) && (
          <Button
            label="Çizgi"
            icon="pi pi-minus"
            className={
              selectedType ===
              'line'
                ? 'drawing-active'
                : ''
            }
            onClick={() =>
              startDrawing(
                'line'
              )
            }
          />
        )}

        {hasPermission(
          'Polygon Ekleme'
        ) && (
          <Button
            label="Poligon"
            icon="pi pi-stop"
            className={
              selectedType ===
              'polygon'
                ? 'drawing-active'
                : ''
            }
            onClick={() =>
              startDrawing(
                'polygon'
              )
            }
          />
        )}

        {hasPermission(
          'Envanter Analizi'
        ) && (
          <>
            <Button
              label="Envanter Analizi"
              icon="pi pi-search"
              className={
                selectedType ===
                'analysis'
                  ? 'drawing-active'
                  : ''
              }
              onClick={
                startInventoryAnalysis
              }
            />

            <Button
              label="Analizi Temizle"
              icon="pi pi-trash"
              onClick={
                clearInventoryAnalysis
              }
            />
          </>
        )}

        <Button
          label={
            heatmapVisible
              ? 'Isı Haritasını Kapat'
              : 'Isı Haritası Analizi'
          }
          icon="pi pi-chart-bar"
          severity={
            heatmapVisible
              ? 'warning'
              : 'secondary'
          }
          outlined={
            !heatmapVisible
          }
          onClick={
            toggleHeatmap
          }
        />

        <div
          title="Kayıtlı geometri sayıları"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '7px 10px',
            borderRadius: '9px',
            border:
              '1px solid rgba(255,255,255,0.16)',
            background:
              'rgba(255,255,255,0.07)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <span>
            📍 {geometryCounts.point}
          </span>

          <span>
            ━ {geometryCounts.line}
          </span>

          <span>
            ▰ {geometryCounts.polygon}
          </span>
        </div>

        <Button
          label="Katmanlar"
          icon="pi pi-clone"
          severity="secondary"
          outlined
          onClick={() =>
            setLayerDialogVisible(
              true
            )
          }
        />

        <Button
          label="Geri Al"
          icon="pi pi-undo"
          severity="secondary"
          outlined
          onClick={
            undoLastDrawPoint
          }
          disabled={
            !selectedType ||
            selectedType === 'point'
          }
        />

        <Button
          label="Türkiye'ye Dön"
          icon="pi pi-home"
          severity="secondary"
          outlined
          onClick={
            goToTurkey
          }
        />

        <Button
          label="Durdur"
          icon="pi pi-times"
          className="stop-drawing-button"
          onClick={
            stopDrawing
          }
        />

        {isAdmin && (
          <Button
            label="Admin Paneli"
            icon="pi pi-cog"
            onClick={
              onOpenAdmin
            }
          />
        )}

            <Button
              icon="pi pi-chevron-up"
              rounded
              text
              aria-label="Çizim araçlarını kapat"
              onClick={() =>
                setDrawingToolsOpen(
                  false
                )
              }
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform:
                  'translateY(-50%)',
                color: '#ffffff',
              }}
            />
          </div>
        )}
      </div>

      <div
        ref={mapElementRef}
        className="map"
      />

      {heatmapVisible && (
        <div
          style={{
            position: 'absolute',
            right: '22px',
            bottom: '22px',
            zIndex: 1000,
            width: '250px',
            padding: '14px 16px',
            borderRadius: '12px',
            background:
              'rgba(255, 255, 255, 0.96)',
            boxShadow:
              '0 8px 24px rgba(0, 0, 0, 0.18)',
            border:
              '1px solid rgba(15, 23, 42, 0.10)',
          }}
        >
          <div
            style={{
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '8px',
              fontSize: '14px',
            }}
          >
            Isı Haritası Yoğunluğu
          </div>

          <div
            style={{
              height: '14px',
              borderRadius: '999px',
              background:
                'linear-gradient(90deg, #0000FF 0%, #00BFFF 25%, #00FF00 50%, #FFFF00 75%, #FF0000 100%)',
              marginBottom: '7px',
              border:
                '1px solid rgba(15, 23, 42, 0.12)',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span>0</span>
            <span>0.25</span>
            <span>0.50</span>
            <span>0.75</span>
            <span>1</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginTop: '5px',
              color: '#64748b',
              fontSize: '11px',
            }}
          >
            <span>Düşük</span>
            <span>Yüksek</span>
          </div>
        </div>
      )}

      <Dialog
        header="Katman Yönetimi"
        visible={
          layerDialogVisible
        }
        style={{
          width: '430px',
        }}
        modal
        onHide={() =>
          setLayerDialogVisible(
            false
          )
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: '14px',
              marginBottom: '4px',
            }}
          >
            Haritada görmek istediğin
            geometri katmanlarını yönet.
          </div>

          {[
            {
              key: 'point',
              label: 'Noktalar',
              icon: 'pi pi-map-marker',
              count: geometryCounts.point,
            },
            {
              key: 'line',
              label: 'Çizgiler',
              icon: 'pi pi-minus',
              count: geometryCounts.line,
            },
            {
              key: 'polygon',
              label: 'Poligonlar',
              icon: 'pi pi-stop',
              count: geometryCounts.polygon,
            },
          ].map((layer) => {
            const isVisible =
              layerVisibility[
                layer.key
              ]

            return (
              <div
                key={layer.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'space-between',
                  gap: '12px',
                  padding:
                    '12px 14px',
                  borderRadius:
                    '10px',
                  border:
                    '1px solid #e2e8f0',
                  background:
                    '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <i
                    className={
                      layer.icon
                    }
                    style={{
                      fontSize:
                        '16px',
                    }}
                  />

                  <div>
                    <div
                      style={{
                        fontWeight:
                          700,
                        color:
                          '#0f172a',
                      }}
                    >
                      {layer.label}
                    </div>

                    <div
                      style={{
                        fontSize:
                          '12px',
                        color:
                          '#64748b',
                        marginTop:
                          '2px',
                      }}
                    >
                      {layer.count}{' '}
                      kayıtlı obje
                    </div>
                  </div>
                </div>

                <Button
                  label={
                    isVisible
                      ? 'Gizle'
                      : 'Göster'
                  }
                  icon={
                    isVisible
                      ? 'pi pi-eye-slash'
                      : 'pi pi-eye'
                  }
                  size="small"
                  severity={
                    isVisible
                      ? 'secondary'
                      : 'success'
                  }
                  outlined
                  onClick={() =>
                    toggleLayerVisibility(
                      layer.key
                    )
                  }
                />
              </div>
            )
          })}

          <Button
            label="Tüm Katmanları Göster"
            icon="pi pi-eye"
            severity="secondary"
            outlined
            onClick={
              showAllLayers
            }
            style={{
              marginTop:
                '6px',
            }}
          />
        </div>
      </Dialog>


      <Dialog
        header="Öznitelik Bilgileri"
        visible={
          popupVisible
        }
        style={{
          width: '420px',
        }}
        modal
        closable={!saving}
        onHide={
          cancelPopup
        }
        footer={
          popupFooter
        }
      >
        <div className="popup-body">
          <div className="popup-field">
            <label htmlFor="geometryName">
              İsim
            </label>

            <InputText
              id="geometryName"
              value={
                geometryName
              }
              onChange={(e) =>
                setGeometryName(
                  e.target.value
                )
              }
              placeholder="Örneğin: Ankara Bölgesi"
              autoFocus
            />
          </div>

          <div className="popup-field">
            <label htmlFor="geometryColor">
              Renk
            </label>

            <div className="color-field">
              <input
                id="geometryColor"
                type="color"
                value={
                  geometryColor
                }
                onChange={(e) =>
                  setGeometryColor(
                    e.target.value
                  )
                }
              />

              <span>
                {geometryColor}
              </span>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Obje Detayı"
        visible={
          detailVisible
        }
        style={{
          width: '440px',
        }}
        modal={false}
        closable={
          !detailSaving
        }
        draggable
        onHide={
          cancelDetail
        }
        footer={
          detailFooter
        }
      >
        <div className="popup-body">
          <div className="popup-field">
            <label htmlFor="detailName">
              İsim
            </label>

            <InputText
              id="detailName"
              value={
                detailName
              }
              onChange={(e) =>
                setDetailName(
                  e.target.value
                )
              }
              disabled={
                !hasPermission(
                  'Obje Güncelleme'
                )
              }
            />
          </div>

          <div className="popup-field">
            <label htmlFor="detailColor">
              Renk
            </label>

            <div className="color-field">
              <input
                id="detailColor"
                type="color"
                value={
                  detailColor
                }
                onChange={(e) =>
                  setDetailColor(
                    e.target.value
                  )
                }
                disabled={
                  !hasPermission(
                    'Obje Güncelleme'
                  )
                }
              />

              <span>
                {detailColor}
              </span>
            </div>
          </div>

          <div className="popup-field">
            <label>
              Geometri
            </label>

            {hasPermission(
              'Obje Güncelleme'
            ) && (
              <>
                <Button
                  label={
                    geometryEditing
                      ? 'Düzenleme Açık'
                      : 'Haritada Geometriyi Düzenle'
                  }
                  icon="pi pi-pencil"
                  severity={
                    geometryEditing
                      ? 'success'
                      : 'secondary'
                  }
                  onClick={
                    startGeometryEdit
                  }
                  disabled={
                    geometryEditing ||
                    detailSaving
                  }
                />

                <small>
                  {geometryEditing
                    ? 'Pencereyi kenara sürükleyip haritadaki noktayı veya köşeleri hareket ettir. Sonra Kaydet.'
                    : 'Bu butona bastıktan sonra objenin konumunu harita üzerinden değiştirebilirsin.'}
                </small>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default MapPage