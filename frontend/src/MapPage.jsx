import { useEffect, useRef, useState } from 'react'

import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import OSM from 'ol/source/OSM.js'
import VectorSource from 'ol/source/Vector.js'
import Draw from 'ol/interaction/Draw.js'
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

function MapPage({ onLogout }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const vectorSourceRef = useRef(null)
  const analysisSourceRef = useRef(null)
  const drawRef = useRef(null)

  const [selectedType, setSelectedType] = useState(null)
  const [message, setMessage] = useState('')
  const [remainingTime, setRemainingTime] = useState(0)

  const [popupVisible, setPopupVisible] = useState(false)
  const [pendingFeature, setPendingFeature] = useState(null)
  const [pendingType, setPendingType] = useState(null)

  const [geometryName, setGeometryName] = useState('')
  const [geometryColor, setGeometryColor] = useState('#ff1744')
  const [saving, setSaving] = useState(false)

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

        const response = await fetch(
          'http://localhost:5092/api/geometry/all',
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
          throw new Error('Kayıtlı çizimler getirilemedi.')
        }

        const data = await response.json()
        const wktFormat = new WKT()

        const addGeometry = (item) => {
          const feature = wktFormat.readFeature(item.wkt, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          })

          feature.set('id', item.id)
          feature.set('name', item.name)
          feature.set('color', item.color || '#ff1744')

          vectorSource.addFeature(feature)
        }

        data.points.forEach(addGeometry)
        data.lines.forEach(addGeometry)
        data.polygons.forEach(addGeometry)
      } catch (error) {
        console.error(error)
        setMessage('Kayıtlı çizimler yüklenemedi.')
      }
    }

    loadSavedGeometries()

    return () => {
      if (drawRef.current) {
        map.removeInteraction(drawRef.current)
      }

      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [onLogout])

  useEffect(() => {
    const updateTimer = () => {
      const expiration = Number(localStorage.getItem('expiration'))
      const difference = expiration - Date.now()

      if (difference <= 0) {
        setRemainingTime(0)
        return
      }

      setRemainingTime(Math.ceil(difference / 1000))
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const removeCurrentDrawInteraction = () => {
    const map = mapRef.current

    if (map && drawRef.current) {
      map.removeInteraction(drawRef.current)
      drawRef.current = null
    }
  }

  const startDrawing = (type) => {
    const map = mapRef.current

    if (!map || !vectorSourceRef.current) return

    removeCurrentDrawInteraction()

    setMessage('')
    setSelectedType(type)

    let geometryType

    if (type === 'point') {
      geometryType = 'Point'
    } else if (type === 'line') {
      geometryType = 'LineString'
    } else if (type === 'polygon') {
      geometryType = 'Polygon'
    } else {
      return
    }

    const draw = new Draw({
      source: vectorSourceRef.current,
      type: geometryType,
    })

    drawRef.current = draw
    map.addInteraction(draw)

    draw.on('drawend', (event) => {
      setPendingFeature(event.feature)
      setPendingType(type)
      setGeometryName('')
      setGeometryColor('#ff1744')
      setPopupVisible(true)
    })
  }

  const getInventoryCount = async (feature) => {
    const wktFormat = new WKT()

    const wkt = wktFormat.writeFeature(feature, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326',
    })

    const token = localStorage.getItem('token')

    const response = await fetch(
      'http://localhost:5092/api/geometry/inventory-count',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wkt,
          name: '',
          color: '',
        }),
      }
    )

    if (response.status === 401) {
      onLogout()
      return null
    }

    if (!response.ok) {
      throw new Error('Envanter analizi başarısız.')
    }

    const data = await response.json()
    return data.count
  }

  const savePendingGeometry = async () => {
    if (!pendingFeature || !pendingType) return

    if (!geometryName.trim()) {
      setMessage('İsim alanı boş bırakılamaz.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const wktFormat = new WKT()

      const wkt = wktFormat.writeFeature(pendingFeature, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      })

      const token = localStorage.getItem('token')

      const response = await fetch(
        `http://localhost:5092/api/geometry/${pendingType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            wkt,
            name: geometryName.trim(),
            color: geometryColor,
          }),
        }
      )

      if (response.status === 401) {
        onLogout()
        return
      }

      if (!response.ok) {
        throw new Error('Kayıt başarısız.')
      }

      pendingFeature.set('name', geometryName.trim())
      pendingFeature.set('color', geometryColor)
      pendingFeature.changed()

      if (pendingType === 'point') {
        setMessage('Nokta başarıyla kaydedildi.')
      } else if (pendingType === 'line') {
        setMessage('Çizgi başarıyla kaydedildi.')
      } else if (pendingType === 'polygon') {
        try {
          const count = await getInventoryCount(pendingFeature)

          if (count !== null) {
            setMessage(
              `Poligon kaydedildi. ${count} envanter ile kesişiyor.`
            )
          }
        } catch (analysisError) {
          console.error(analysisError)
          setMessage('Poligon kaydedildi fakat envanter analizi yapılamadı.')
        }
      }

      setPopupVisible(false)
      setPendingFeature(null)
      setPendingType(null)
      setGeometryName('')
      setGeometryColor('#ff1744')
    } catch (error) {
      console.error(error)
      setMessage('Çizim veritabanına kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const cancelPopup = () => {
    if (pendingFeature && vectorSourceRef.current) {
      vectorSourceRef.current.removeFeature(pendingFeature)
    }

    setPopupVisible(false)
    setPendingFeature(null)
    setPendingType(null)
    setGeometryName('')
    setGeometryColor('#ff1744')
    setMessage('')
  }

  const startInventoryAnalysis = () => {
    const map = mapRef.current
    const analysisSource = analysisSourceRef.current

    if (!map || !analysisSource) return

    removeCurrentDrawInteraction()
    analysisSource.clear()

    setSelectedType('analysis')
    setMessage('Analiz poligonunu çizin.')

    const draw = new Draw({
      source: analysisSource,
      type: 'Polygon',
    })

    drawRef.current = draw
    map.addInteraction(draw)

    draw.on('drawend', async (event) => {
      try {
        const count = await getInventoryCount(event.feature)

        if (count !== null) {
          setMessage(
            `Envanter Analizi: ${count} envanter ile kesişiyor.`
          )
        }
      } catch (error) {
        console.error(error)
        setMessage('Envanter analizi yapılamadı.')
      }

      removeCurrentDrawInteraction()
      setSelectedType(null)
    })
  }

  const clearInventoryAnalysis = () => {
    removeCurrentDrawInteraction()

    if (analysisSourceRef.current) {
      analysisSourceRef.current.clear()
    }

    setSelectedType(null)
    setMessage('Analiz poligonu temizlendi.')
  }

  const stopDrawing = () => {
    removeCurrentDrawInteraction()
    setSelectedType(null)
    setMessage('')
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
        label={saving ? 'Kaydediliyor...' : 'Kaydet'}
        icon="pi pi-check"
        onClick={savePendingGeometry}
        disabled={saving}
      />
    </div>
  )

  return (
    <div className="map-page">
      <header>
        <h2>Türkiye Haritası</h2>

        <div className="header-actions">
          <div className="session-timer">
            Oturum Süresi: {formatTime(remainingTime)}
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
          className={selectedType === 'point' ? 'drawing-active' : ''}
          onClick={() => startDrawing('point')}
        />

        <Button
          label="Çizgi"
          icon="pi pi-minus"
          className={selectedType === 'line' ? 'drawing-active' : ''}
          onClick={() => startDrawing('line')}
        />

        <Button
          label="Poligon"
          icon="pi pi-stop"
          className={selectedType === 'polygon' ? 'drawing-active' : ''}
          onClick={() => startDrawing('polygon')}
        />

        <Button
          label="Envanter Analizi"
          icon="pi pi-search"
          className={selectedType === 'analysis' ? 'drawing-active' : ''}
          onClick={startInventoryAnalysis}
        />

        <Button
          label="Analizi Temizle"
          icon="pi pi-trash"
          onClick={clearInventoryAnalysis}
        />

        <Button
          label="Durdur"
          icon="pi pi-times"
          className="stop-drawing-button"
          onClick={stopDrawing}
        />
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
        visible={popupVisible}
        style={{ width: '420px' }}
        modal
        closable={!saving}
        onHide={cancelPopup}
        footer={popupFooter}
      >
        <div className="popup-body">
          <div className="popup-field">
            <label htmlFor="geometryName">
              İsim
            </label>

            <InputText
              id="geometryName"
              value={geometryName}
              onChange={(e) => setGeometryName(e.target.value)}
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
                value={geometryColor}
                onChange={(e) => setGeometryColor(e.target.value)}
              />

              <span>
                {geometryColor}
              </span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default MapPage
