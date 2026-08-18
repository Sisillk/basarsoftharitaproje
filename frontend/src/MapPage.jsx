import { useEffect, useRef, useState } from 'react'

import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import OSM from 'ol/source/OSM.js'
import VectorSource from 'ol/source/Vector.js'
import Draw from 'ol/interaction/Draw.js'
import Modify from 'ol/interaction/Modify.js'
import Collection from 'ol/Collection.js'
import WKT from 'ol/format/WKT.js'
import { fromLonLat } from 'ol/proj.js'

import Style from 'ol/style/Style.js'
import Stroke from 'ol/style/Stroke.js'
import Fill from 'ol/style/Fill.js'
import CircleStyle from 'ol/style/Circle.js'

import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'

import 'ol/ol.css'

const API_URL = 'http://localhost:5092/api/geometry'

function MapPage({ token, onLogout, onOpenAdmin }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const vectorSourceRef = useRef(null)
  const analysisSourceRef = useRef(null)
  const drawRef = useRef(null)
  const modifyRef = useRef(null)
  const originalGeometryRef = useRef(null)

  const [selectedType, setSelectedType] = useState(null)
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

  const hasPermission = (permissionName) => {
    return permissionNames.includes(permissionName)
  }

  const createGeometryStyle = (feature) => {
    const geometry = feature.getGeometry()

    if (!geometry) return null

    const type = geometry.getType()
    const color = feature.get('color') || '#ff1744'

    if (type === 'Point') {
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color }),
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
    const vectorSource = new VectorSource()
    const analysisSource = new VectorSource()

    vectorSourceRef.current = vectorSource
    analysisSourceRef.current = analysisSource

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: createGeometryStyle,
    })

    const analysisLayer = new VectorLayer({
      source: analysisSource,
      style: analysisStyle,
    })

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
        analysisLayer,
      ],
      view: new View({
        center: fromLonLat([35.24, 38.96]),
        zoom: 5.5,
      }),
    })

    mapRef.current = map

    const loadSavedGeometries = async () => {
      try {
        const token = localStorage.getItem('token')

        const response = await fetch(`${API_URL}/all`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          onLogout()
          return
        }

        if (!response.ok) {
          throw new Error('Kayıtlı çizimler getirilemedi.')
        }

        const data = await response.json()
        const wktFormat = new WKT()

        const addGeometry = (item, type) => {
          const feature = wktFormat.readFeature(item.wkt, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          })

          feature.set('id', item.id)
          feature.set('type', type)
          feature.set('name', item.name)
          feature.set('color', item.color || '#ff1744')

          vectorSource.addFeature(feature)
        }

        data.points.forEach((item) => addGeometry(item, 'point'))
        data.lines.forEach((item) => addGeometry(item, 'line'))
        data.polygons.forEach((item) => addGeometry(item, 'polygon'))
      } catch (error) {
        console.error(error)
        setMessage(
          'Kayıtlı çizimler yüklenemedi. Backend çalışıyor mu kontrol et.'
        )
      }
    }

    loadSavedGeometries()

    const handleMapClick = (event) => {
      if (drawRef.current || modifyRef.current) return

      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (foundFeature) => {
          if (
            foundFeature.get('id') &&
            foundFeature.get('type')
          ) {
            return foundFeature
          }

          return null
        }
      )

      if (!feature) return

      originalGeometryRef.current =
        feature.getGeometry().clone()

      setSelectedFeature(feature)
      setDetailName(feature.get('name') || '')
      setDetailColor(
        feature.get('color') || '#ff1744'
      )
      setDetailVisible(true)
      setMessage('')
    }

    map.on('singleclick', handleMapClick)

    return () => {
      map.un('singleclick', handleMapClick)

      if (drawRef.current) {
        map.removeInteraction(
          drawRef.current
        )
      }

      if (modifyRef.current) {
        map.removeInteraction(
          modifyRef.current
        )
      }

      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [onLogout])

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
      (event) => {
        setPendingFeature(
          event.feature
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

        setTimeout(() => {
          removeCurrentDrawInteraction()

          setSelectedType(
            null
          )
        }, 0)
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

        pendingFeature.changed()

        if (
          pendingType === 'point'
        ) {
          setMessage(
            'Nokta başarıyla kaydedildi.'
          )
        } else if (
          pendingType === 'line'
        ) {
          setMessage(
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
              setMessage(
                `Poligon kaydedildi. ${count} envanter ile kesişiyor.`
              )
            }
          } catch (
            analysisError
          ) {
            console.error(
              analysisError
            )

            setMessage(
              'Poligon kaydedildi fakat envanter analizi yapılamadı.'
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

        setMessage(
          error.message ||
            'Çizim veritabanına kaydedilemedi.'
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
              setMessage(
                `Envanter Analizi: ${count} envanter ile kesişiyor.`
              )
            }
          } catch (error) {
            console.error(error)

            setMessage(
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

        selectedFeature.changed()

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
      } catch (error) {
        console.error(error)

        setMessage(
          error.message ||
            'Obje güncellenemedi.'
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

        setMessage(
          'Obje başarıyla silindi.'
        )
      } catch (error) {
        console.error(error)

        setMessage(
          error.message ||
            'Obje silinemedi.'
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
      <Button
        label="Sil"
        icon="pi pi-trash"
        severity="danger"
        onClick={
          deleteSelectedFeature
        }
        disabled={
          detailSaving ||
          !hasPermission(
            'Obje Silme'
          )
        }
      />

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
            detailSaving ||
            !hasPermission(
              'Obje Güncelleme'
            )
          }
        />
      </div>
    </div>
  )

  return (
    <div className="map-page">
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

      <div className="drawing-toolbar">
        <div className="drawing-title">
          Çizim Araçları
        </div>

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
          disabled={
            !hasPermission(
              'Point Ekleme'
            )
          }
        />

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
          disabled={
            !hasPermission(
              'Line Ekleme'
            )
          }
        />

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
          disabled={
            !hasPermission(
              'Polygon Ekleme'
            )
          }
        />

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
          disabled={
            !hasPermission(
              'Envanter Analizi'
            )
          }
        />

        <Button
          label="Analizi Temizle"
          icon="pi pi-trash"
          onClick={
            clearInventoryAnalysis
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
      </div>

      {message && (
        <div className="map-message">
          {message}
        </div>
      )}

      <div
        ref={mapElementRef}
        className="map"
      />

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
                detailSaving ||
                !hasPermission(
                  'Obje Güncelleme'
                )
              }
            />

            <small>
              {geometryEditing
                ? 'Pencereyi kenara sürükleyip haritadaki noktayı veya köşeleri hareket ettir. Sonra Kaydet.'
                : 'Bu butona bastıktan sonra objenin konumunu harita üzerinden değiştirebilirsin.'}
            </small>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default MapPage