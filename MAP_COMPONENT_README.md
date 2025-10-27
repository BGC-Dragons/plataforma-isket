# Componente de Mapa - Google Maps

Este componente fornece uma integração completa com a Google Maps API para exibir propriedades em um mapa interativo.

## Funcionalidades

- ✅ Mapa interativo do Google Maps
- ✅ Marcadores personalizados por tipo de propriedade
- ✅ InfoWindow com detalhes da propriedade
- ✅ Coordenadas mockadas para demonstração
- ✅ Integração com dados de propriedades existentes
- ✅ Responsivo e adaptável
- ✅ Controles de zoom e navegação
- ✅ Estilização consistente com o tema da aplicação

## Como Usar

### 1. Importar o Componente

```tsx
import { MapComponent } from "../../../modules/search/map";
```

### 2. Usar o Componente

```tsx
<MapComponent
  properties={filteredProperties}
  onPropertyClick={handlePropertyClick}
  height="100%"
  center={{
    lat: -25.4284, // Curitiba
    lng: -49.2733,
  }}
  zoom={12}
/>
```

### 3. Props do Componente

| Prop              | Tipo                           | Obrigatório | Descrição                                 |
| ----------------- | ------------------------------ | ----------- | ----------------------------------------- |
| `properties`      | `PropertyData[]`               | ✅          | Array de propriedades para exibir no mapa |
| `onPropertyClick` | `(propertyId: string) => void` | ❌          | Callback quando uma propriedade é clicada |
| `center`          | `{ lat: number; lng: number }` | ❌          | Centro do mapa (padrão: Curitiba)         |
| `zoom`            | `number`                       | ❌          | Nível de zoom (padrão: 12)                |
| `height`          | `string \| number`             | ❌          | Altura do mapa (padrão: 500px)            |

### 4. Interface PropertyData

```tsx
interface PropertyData {
  id: string;
  title?: string;
  price: number;
  pricePerSquareMeter: number;
  address: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  images: string[];
  isFavorite?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
```

## Configuração

### 1. API Key do Google Maps

A API key está configurada em `src/scripts/config/google.constant.ts`:

```tsx
export const GOOGLE_CONFIG = {
  CLIENT_ID: "seu-client-id",
  MAPS_API_KEY: "sua-api-key",
} as const;
```

### 2. Dependências Necessárias

As seguintes dependências já estão instaladas:

```json
{
  "@react-google-maps/api": "^2.20.7",
  "@googlemaps/js-api-loader": "^1.16.10",
  "@types/google.maps": "^3.58.1"
}
```

## Exemplos de Uso

### 1. Mapa Simples

```tsx
<MapComponent properties={properties} height={400} />
```

### 2. Mapa com Callback

```tsx
<MapComponent
  properties={properties}
  onPropertyClick={(propertyId) => {
    console.log("Propriedade clicada:", propertyId);
    // Navegar para página de detalhes
  }}
  height="100%"
/>
```

### 3. Mapa Customizado

```tsx
<MapComponent
  properties={properties}
  center={{ lat: -23.5505, lng: -46.6333 }} // São Paulo
  zoom={15}
  height={600}
  onPropertyClick={handlePropertyClick}
/>
```

## Layout Responsivo

O componente se adapta automaticamente a diferentes tamanhos de tela:

- **Desktop (md+)**: Mapa visível ao lado dos cards
- **Mobile (xs-sm)**: Mapa oculto para economizar espaço

## Marcadores Personalizados

Os marcadores são personalizados por tipo de propriedade:

- 🔵 **Residencial**: Azul (primary)
- 🔴 **Comercial**: Vermelho (error)
- 🟢 **Terreno**: Verde (success)

## InfoWindow

Quando um marcador é clicado, um InfoWindow é exibido com:

- Título da propriedade
- Preço formatado
- Preço por m²
- Endereço completo
- Detalhes específicos (quartos, banheiros, área)
- Botão "Ver detalhes"

## Coordenadas Mockadas

Para demonstração, o componente gera coordenadas aleatórias próximas ao centro de Curitiba quando não são fornecidas coordenadas específicas.

## Troubleshooting

### 1. Mapa não carrega

- Verifique se a API key está correta
- Confirme se a API key tem as permissões necessárias
- Verifique o console do navegador para erros

### 2. Marcadores não aparecem

- Verifique se as propriedades têm coordenadas válidas
- Confirme se o array de propriedades não está vazio

### 3. InfoWindow não funciona

- Verifique se o callback `onPropertyClick` está definido
- Confirme se as propriedades têm os dados necessários

## Próximos Passos

- [ ] Integração com geocoding para converter endereços em coordenadas
- [ ] Clustering de marcadores para melhor performance
- [ ] Filtros de propriedade no mapa
- [ ] Modo de visualização satélite
- [ ] Integração com Street View
