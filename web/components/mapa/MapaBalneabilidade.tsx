"use client";
import { useEffect, useState } from "react";
import type { Ponto, Municipio } from "@/lib/types";
import { formatDate, statusColor } from "@/lib/utils";

interface Props {
  pontos: Ponto[];
  municipios: Municipio[];
  filtroMunicipio?: string;
}

export function MapaBalneabilidade({ pontos, municipios, filtroMunicipio: filtroInicial }: Props) {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [filtro, setFiltro] = useState(filtroInicial ?? "todos");

  // Carrega Leaflet apenas no browser (SSR não suporta)
  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
    ]).then(([rl, L]) => {
      // Fix dos ícones do Leaflet no Next.js
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setMapComponents({ ...rl, L: L.default });
    });
  }, []);

  const pontosFiltrados = filtro === "todos"
    ? pontos.filter((p) => p.lat && p.lon)
    : pontos.filter((p) => p.lat && p.lon && p.municipio_slug === filtro);

  if (!MapComponents) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-gray-500 text-sm">Carregando mapa...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = MapComponents;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Filtro */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          <option value="todos">Todos os municípios ({pontos.filter(p => p.lat).length} pontos)</option>
          {municipios.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.nome} ({m.n_pontos} pontos)
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 text-xs text-gray-600 ml-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Própria</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Imprópria</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>Sem dados</span>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: "500px" }}>
        <MapContainer
          center={[-27.5, -48.5]}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pontosFiltrados.map((p) => {
            const cor = statusColor(p.ultimo_status);
            const propLabel = p.ultimo_status === "propria" ? "✅ Própria" : p.ultimo_status === "impropria" ? "🚫 Imprópria" : "⚪ Sem dados";
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat!, p.lon!]}
                radius={7}
                pathOptions={{
                  color: "#fff",
                  weight: 1.5,
                  fillColor: cor,
                  fillOpacity: 0.9,
                }}
              >
                <Popup maxWidth={260}>
                  <div className="text-sm">
                    <div className="font-bold text-base mb-1">{propLabel}</div>
                    <div className="font-semibold">{p.praia}</div>
                    {p.ponto_num && <div className="text-gray-500">Ponto {p.ponto_num}</div>}
                    <div className="text-gray-600 text-xs mb-1">{p.municipio}</div>
                    {p.descricao && <div className="text-gray-500 text-xs italic mb-2">{p.descricao}</div>}
                    {p.ultima_coleta && (
                      <div className="text-gray-500 text-xs">Coletado em: {formatDate(p.ultima_coleta)}</div>
                    )}
                    {p.pct_proprias_historico !== null && (
                      <div className="text-gray-500 text-xs">{p.pct_proprias_historico}% próprias no histórico</div>
                    )}
                    <a
                      href={`/praia/${p.id}`}
                      className="mt-2 block text-center text-xs bg-teal-600 text-white py-1 px-3 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Ver histórico completo →
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Exibindo {pontosFiltrados.length} de {pontos.filter(p => p.lat).length} pontos com coordenadas
      </p>
    </div>
  );
}
