# Natal Chart Calculator

Calculadora de mapas astrais com cinco métodos de análise: Tradicional (12 signos), Hermético (24 signos), Anjos Cabalísticos (72 signos), Astrologia Cabalística (Sephiroth) e Agathadaimon (Nome do Anjo da Guarda).

## Arquitetura

Aplicação FastAPI com pipeline unificado baseado em dataclasses. Cada método enriquece o esquema `Chart` com seus próprios campos específicos.

### Métodos de Cálculo

- **Tradicional**: Mapa astral padrão com 12 signos, aspectos e posições planetárias. Frontend renderiza roda SVG interativa.
- **Hermético**: 24 signos (12 signos + 12 títulos de tarô nas bordas dos signos). Adiciona campo `hermetic_title`. Retorna JSON.
- **Anjos Cabalísticos**: 72 anjos do Shem HaMephorash, mapeados por bins de 5°. Adiciona campo `angel`. Retorna JSON.
- **Sephiroth**: Mapeamento para a Árvore da Vida Cabalística (esquemas decânico e tradicional). Retorna JSON com dados já presentes no `PointData`.
- **Agathadaimon**: Calcula nome de três letras baseado em Sol, Lua e Ascendente + sufixo dia/noite. Retorna `{chart, daimon}`.

### API

**Endpoint único**: `POST /calculate`

```json
{
  "date": "1990-06-25",
  "time": "22:15",
  "city": "São Paulo",
  "method": "traditional"
}
```

Resposta: método tradicional renderiza SVG no frontend; outros métodos retornam JSON cru.

## Estrutura do Projeto

```
app/
├── main.py              # FastAPI endpoints
├── engine.py            # Pipeline unificado de cálculo
├── schema.py            # Dataclasses: Birth, PointData, Aspect, Chart
├── models.py            # ChartRequest (Pydantic)
├── geocoder.py          # Geocoding e timezone automático
├── hermetic.py          # Método hermético (24 signos)
├── angels.py            # 72 anjos cabalísticos
├── agathadaimon.py      # Agathos Daimon
├── sephiroth.py         # Mapeamento Sephiroth
├── static/js/
│   ├── natal.js         # Renderizador SVG da roda
│   └── index.js         # Handler do formulário
└── templates/
    └── index.html       # Interface web
```

## Tecnologias

- **Backend**: Python 3.14, FastAPI, Kerykeion 4.2.4
- **Frontend**: Vanilla JS, SVG puro, Bulma CSS
- **Geocoding**: geopy + timezonefinder

## Instalação

```bash
git clone https://github.com/croco-br/natal-chart.git
cd natal-chart
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Acesse: http://127.0.0.1:8000

## Refatoração (Julho 2026)

Unificação de dois pipelines paralelos (legacy mutável + novo canônico) em um único pipeline baseado em `Chart` dataclass. Métodos esotéricos agora são funções puras de enriquecimento. Frontend simplificado: tradicional mostra SVG, outros mostram JSON. Redução de 38% no código-fonte (1.735 → 1.078 linhas).

## Licença

UNLICENSE — domínio público.


