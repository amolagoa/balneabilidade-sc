"use client";
import { useEffect, useState } from "react";
import type { Ponto } from "@/lib/types";
import { formatDate, statusColor } from "@/lib/utils";

interface Props {
  pontos: Ponto[];
  center: [number, number];
  zoom: number;
}

export function MapaPontos({ pontos, center, zoom }: Props) {
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setMapComponents({ ...rl, L: L.default });
    });
  }, []);

  if (!MapComponents) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 text-sm">
        Carregando mapa...
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents;

  return (
    <div className="h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pontos.filter((p) => p.lat && p.lon).map((p) => {
          const cor = statusColor(p.ultimo_status);
          const label =
            p.ultimo_status === "propria" ? "✅ Própria" :
            p.ultimo_status === "impropria" ? "🚫 Imprópria" : "⚪ Sem dados";
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat!, p.lon!]}
              radius={10}
              pathOptions={{ color: "#fff", weight: 2, fillColor: cor, fillOpacity: 0.9 }}
            >
              <Popup maxWidth={220}>
                <div className="text-sm">
                  <div className="font-bold mb-1">{label}</div>
                  <div className="font-semibold">Ponto {p.ponto_num}</div>
                  {p.descricao && <div className="text-gray-500 text-xs italic mb-2">{p.descricao}</div>}
                  {p.ultima_coleta && (
                    <div className="text-gray-500 text-xs">Coleta: {formatDate(p.ultima_coleta)}</div>
                  )}
                  {p.pct_proprias_historico !== null && (
                    <div className="text-gray-500 text-xs">{p.pct_proprias_historico}% próprias no histórico</div>
                  )}
                  <a
                    href={`/praia/${p.id}`}
                    className="mt-2 block text-center text-xs bg-teal-600 text-white py-1 px-3 rounded-lg hover:bg-teal-700"
                  >
                    Ver histórico →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
