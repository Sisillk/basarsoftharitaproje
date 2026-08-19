import { useEffect, useRef, useState } from "react";
import "ol/ol.css";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

import Map from "ol/Map";
import View from "ol/View";

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";

import Draw from "ol/interaction/Draw";

import WKT from "ol/format/WKT";

import { fromLonLat, transformExtent } from "ol/proj";

import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";


export default function GeoAuthorizationDialog({
    visible,
    onHide,

    entityType,
    entityId,
    entityName,

    token,

    apiBaseUrl = "http://localhost:5092",

    onSaved
}) {
    const mapElementRef = useRef(null);

    const mapRef = useRef(null);
    const vectorSourceRef = useRef(null);
    const drawRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("");


    const showStatus = (message, type = "info") => {
        setStatusMessage(message);
        setStatusType(type);
    };


    const getEndpoint = () => {
        if (
            entityId === null ||
            entityId === undefined
        ) {
            return null;
        }

        if (entityType === "user") {
            return `${apiBaseUrl}/api/admin/users/${entityId}/geo`;
        }

        if (entityType === "role") {
            return `${apiBaseUrl}/api/admin/roles/${entityId}/geo`;
        }

        return null;
    };


    const fitTurkey = (map) => {
        const turkeyExtent4326 = [
            25.5,
            35.8,
            44.8,
            42.2
        ];

        const turkeyExtent3857 =
            transformExtent(
                turkeyExtent4326,
                "EPSG:4326",
                "EPSG:3857"
            );

        map.getView().fit(
            turkeyExtent3857,
            {
                padding: [40, 40, 40, 40],
                duration: 0
            }
        );
    };


    const cleanupMap = () => {
        if (
            mapRef.current &&
            drawRef.current
        ) {
            mapRef.current.removeInteraction(
                drawRef.current
            );
        }

        if (mapRef.current) {
            mapRef.current.setTarget(undefined);
        }

        drawRef.current = null;
        mapRef.current = null;
        vectorSourceRef.current = null;
    };


    const loadExistingAuthorization =
        async (map, source) => {
            const endpoint = getEndpoint();

            if (!endpoint) {
                showStatus(
                    "Kullanıcı/rol bilgisi bulunamadı.",
                    "error"
                );
                return;
            }

            setLoading(true);
            setStatusMessage("");

            try {
                const response =
                    await fetch(
                        endpoint,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        "Coğrafi yetki bilgisi alınamadı."
                    );
                }

                source.clear();

                if (
                    data?.wkt &&
                    data.wkt.trim() !== ""
                ) {
                    const format = new WKT();

                    const feature =
                        format.readFeature(
                            data.wkt,
                            {
                                dataProjection:
                                    "EPSG:4326",

                                featureProjection:
                                    "EPSG:3857"
                            }
                        );

                    source.addFeature(feature);

                    map.getView().fit(
                        feature
                            .getGeometry()
                            .getExtent(),
                        {
                            padding: [60, 60, 60, 60],
                            maxZoom: 10,
                            duration: 0
                        }
                    );

                    showStatus(
                        "Mevcut coğrafi yetki alanı yüklendi.",
                        "info"
                    );
                }
                else {
                    fitTurkey(map);

                    showStatus(
                        "Henüz coğrafi yetki tanımlanmamış. Haritada polygon çizip Kaydet'e bas.",
                        "info"
                    );
                }
            }
            catch (error) {
                console.error(error);

                showStatus(
                    error.message ||
                    "Coğrafi yetki bilgisi yüklenemedi.",
                    "error"
                );

                fitTurkey(map);
            }
            finally {
                setLoading(false);
            }
        };


    const initializeMap = () => {
        cleanupMap();

        if (!mapElementRef.current) {
            showStatus(
                "Harita alanı hazırlanamadı.",
                "error"
            );
            return;
        }

        const source = new VectorSource();

        vectorSourceRef.current = source;

        const vectorLayer =
            new VectorLayer({
                source,

                style: new Style({
                    stroke:
                        new Stroke({
                            width: 3
                        }),

                    fill:
                        new Fill({
                            color:
                                "rgba(0, 120, 255, 0.15)"
                        })
                })
            });


        const map =
            new Map({
                target:
                    mapElementRef.current,

                layers: [
                    new TileLayer({
                        source: new OSM()
                    }),

                    vectorLayer
                ],

                view:
                    new View({
                        center:
                            fromLonLat([
                                35.24,
                                38.96
                            ]),

                        zoom: 5
                    })
            });


        mapRef.current = map;


        const draw =
            new Draw({
                source,
                type: "Polygon"
            });


        draw.on(
            "drawstart",
            () => {
                source.clear();

                showStatus(
                    "Yeni alan çiziliyor...",
                    "info"
                );
            }
        );


        draw.on(
            "drawend",
            () => {
                showStatus(
                    "Polygon hazır. Kaydet'e bas.",
                    "info"
                );
            }
        );


        map.addInteraction(draw);

        drawRef.current = draw;


        requestAnimationFrame(
            () => {
                map.updateSize();

                loadExistingAuthorization(
                    map,
                    source
                );
            }
        );
    };


    const handleDialogShow = () => {
        setStatusMessage("");

        setTimeout(
            () => {
                initializeMap();
            },
            50
        );
    };


    const handleDialogHide = () => {
        cleanupMap();
        onHide();
    };


    useEffect(() => {
        return () => {
            cleanupMap();
        };
    }, []);


    const handleSave =
        async () => {
            setStatusMessage("");

            const endpoint = getEndpoint();

            if (!endpoint) {
                showStatus(
                    "Kaydetme adresi oluşturulamadı.",
                    "error"
                );
                return;
            }

            if (!vectorSourceRef.current) {
                showStatus(
                    "Harita hazır değil.",
                    "error"
                );
                return;
            }

            const features =
                vectorSourceRef.current
                    .getFeatures();

            if (
                !features ||
                features.length === 0
            ) {
                showStatus(
                    "Önce haritada bir polygon çiz.",
                    "error"
                );
                return;
            }

            setSaving(true);

            try {
                const format = new WKT();

                const wkt =
                    format.writeFeature(
                        features[0],
                        {
                            dataProjection:
                                "EPSG:4326",

                            featureProjection:
                                "EPSG:3857"
                        }
                    );

                const response =
                    await fetch(
                        endpoint,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    wkt
                                })
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        `Coğrafi yetki kaydedilemedi. HTTP ${response.status}`
                    );
                }

                showStatus(
                    "✓ Coğrafi yetki başarıyla kaydedildi.",
                    "success"
                );

                if (onSaved) {
                    onSaved();
                }
            }
            catch (error) {
                console.error(error);

                showStatus(
                    error.message ||
                    "Coğrafi yetki kaydedilemedi.",
                    "error"
                );
            }
            finally {
                setSaving(false);
            }
        };


    const handleClear =
        async () => {
            setStatusMessage("");

            const endpoint = getEndpoint();

            if (!endpoint) {
                showStatus(
                    "Silme adresi oluşturulamadı.",
                    "error"
                );
                return;
            }

            const confirmed =
                window.confirm(
                    "Bu coğrafi yetkiyi kaldırmak istiyor musun?"
                );

            if (!confirmed) {
                return;
            }

            setSaving(true);

            try {
                const response =
                    await fetch(
                        endpoint,
                        {
                            method: "DELETE",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        `Coğrafi yetki kaldırılamadı. HTTP ${response.status}`
                    );
                }

                vectorSourceRef.current
                    ?.clear();

                if (mapRef.current) {
                    fitTurkey(
                        mapRef.current
                    );
                }

                showStatus(
                    "✓ Coğrafi yetki kaldırıldı.",
                    "success"
                );

                if (onSaved) {
                    onSaved();
                }
            }
            catch (error) {
                console.error(error);

                showStatus(
                    error.message ||
                    "Coğrafi yetki kaldırılamadı.",
                    "error"
                );
            }
            finally {
                setSaving(false);
            }
        };


    const statusStyle = {
        marginBottom: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        fontWeight: 600,

        background:
            statusType === "success"
                ? "#e8f7ed"
                : statusType === "error"
                    ? "#fdecec"
                    : "#eef5ff",

        color:
            statusType === "success"
                ? "#18733b"
                : statusType === "error"
                    ? "#b42318"
                    : "#245b9e",

        border:
            statusType === "success"
                ? "1px solid #b7e4c7"
                : statusType === "error"
                    ? "1px solid #f3b8b5"
                    : "1px solid #bfd7ff"
    };


    const footer = (
        <div
            style={{
                display: "flex",
                justifyContent:
                    "space-between",
                gap: "0.75rem"
            }}
        >
            <Button
                label="Yetkiyi Kaldır"
                icon="pi pi-trash"
                severity="danger"
                outlined
                onClick={handleClear}
                disabled={
                    loading ||
                    saving
                }
            />

            <div
                style={{
                    display: "flex",
                    gap: "0.75rem"
                }}
            >
                <Button
                    label="Kapat"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    onClick={handleDialogHide}
                    disabled={saving}
                />

                <Button
                    label="Kaydet"
                    icon="pi pi-check"
                    onClick={handleSave}
                    loading={saving}
                    disabled={loading}
                />
            </div>
        </div>
    );


    return (
        <Dialog
            header={
                `Coğrafi Yetki - ${entityName || ""}`
            }
            visible={visible}
            onShow={handleDialogShow}
            onHide={handleDialogHide}
            modal
            style={{
                width: "90vw",
                maxWidth: "1100px"
            }}
            contentStyle={{
                paddingBottom:
                    "1rem"
            }}
            footer={footer}
        >
            <div
                style={{
                    marginBottom:
                        "0.75rem"
                }}
            >
                Haritada izin verilecek alanı
                <b> Polygon </b>
                olarak çiz.
                Yeni polygon çizmeye
                başladığında eski alan
                otomatik temizlenir.
            </div>

            {statusMessage && (
                <div style={statusStyle}>
                    {statusMessage}
                </div>
            )}

            <div
                ref={mapElementRef}
                style={{
                    width: "100%",
                    height: "520px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#eef3f8"
                }}
            />
        </Dialog>
    );
}
