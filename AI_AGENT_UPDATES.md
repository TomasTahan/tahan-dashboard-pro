# Actualizaciones del Agente de IA

## Cambios Necesarios en el Agente Python

### 1. Actualizar el Schema de Pydantic

```python
class ReceiptSchema(BaseModel):
    referencia: Optional[str] = Field(None, description="Identificador único del recibo si está disponible")
    razon_social: Optional[str] = Field(None, description="Razón social del emisor si está disponible")
    date: str = Field(..., description="Fecha del recibo en formato dd/MM/yyyy y en caso de que esté disponible agregar hora en formato HH:mm:ss")
    total: float = Field(..., description="Monto total del recibo")
    moneda: Optional[str] = Field(None, description="Segun el país de la boleta, la moneda puede cambiar. CLP para Chile, ARS para Argentina, BRL para Brasil, PEN para Perú y PYG para Paraguay.")
    descripcion: Optional[str] = Field(None, description="En caso de que esté disponible, agregar una descripción del recibo. Ejemplo: 'Compra de combustible en estación Shell'")
    identificador_fiscal: Optional[str] = Field(None, description="Número de identificación fiscal del emisor del recibo si está disponible. Ejemplos:'CUIT arg, RUT chile, CNPJ brasil, RUC peru y RUC paraguay'")

    # NUEVO CAMPO
    keywords: List[str] = Field(
        default_factory=list,
        description=(
            "Lista de palabras clave que identifican el tipo de gasto. "
            "Basándote en la imagen Y en la descripción del conductor (si está disponible), "
            "genera 3-5 keywords relevantes que ayuden a categorizar este gasto. "
            "Ejemplos: "
            "- Peaje → ['peaje', 'tag', 'autopista', 'ruta'] "
            "- Combustible → ['combustible', 'diesel', 'gasolina', 'fuel'] "
            "- Hotel → ['hotel', 'alojamiento', 'hospedaje', 'lodging'] "
            "- Comida → ['comida', 'restaurant', 'almuerzo', 'food'] "
            "- Reparación → ['reparacion', 'taller', 'mecanico', 'service'] "
            "Incluye tanto palabras en español como posibles términos en inglés si son relevantes."
        )
    )
```

### 2. Actualizar el Estado del Grafo

```python
class GraphState(TypedDict):
    image_url: str  # input
    conductor_description: Optional[str]  # NUEVO: descripción verbal del conductor
    result: Dict[str, Any]  # output final
```

### 3. Actualizar el Request Model de FastAPI

```python
class ReceiptRequest(BaseModel):
    image_url: str
    conductor_description: Optional[str] = None  # NUEVO campo opcional
```

### 4. Actualizar el Response Model

```python
class ReceiptResponse(BaseModel):
    referencia: str | None
    razon_social: str | None
    date: str
    total: float
    moneda: str | None
    descripcion: str | None
    identificador_fiscal: str | None
    keywords: List[str]  # NUEVO
```

### 5. Actualizar el System Prompt

```python
SYSTEM_PROMPT = (
    """
    Eres un agente que ayuda a mi empresa a ordenar los gastos de los choferes.

    Tu trabajo es analizar imágenes de boletas/recibos que los choferes sacan con sus teléfonos
    y extraer información estructurada en formato JSON para guardar en la base de datos.

    ## Campos a extraer:

    1. **referencia**: Identificador único del recibo. Si no hay uno obvio pero ves algún valor único
       (número de factura, código, etc.), úsalo. Si no hay nada, pon null.

    2. **razon_social**: Nombre de la empresa/comercio emisor. Si no está visible, pon null.

    3. **date**: Fecha en formato dd/MM/yyyy. Si hay hora disponible, agrégala en formato HH:mm:ss.
       Ejemplo: "17/11/2025 14:30:00"

    4. **total**: Monto total del recibo como número decimal.

    5. **moneda**: Identifica el país de la boleta:
       - Chile → CLP
       - Argentina → ARS
       - Brasil → BRL
       - Perú → PEN
       - Paraguay → PYG

    6. **descripcion**: Descripción del gasto extraída de la boleta.
       Ejemplo: "Compra de combustible en estación Shell"

    7. **identificador_fiscal**: Número de identificación fiscal del emisor (CUIT, RUT, CNPJ, RUC).
       Si no está, pon null.

    8. **keywords**: IMPORTANTE - Genera 3-5 palabras clave que ayuden a categorizar este gasto.
       - Analiza la imagen para identificar el tipo de gasto
       - Si el conductor proporcionó una descripción verbal, úsala para generar keywords más precisas
       - Incluye términos en español y posibles variantes
       - Ejemplos:
         * "Peaje de Cristo Redentor" → ["peaje", "tag", "autopista", "internacional", "ruta"]
         * "Nafta YPF" → ["combustible", "gasolina", "nafta", "ypf", "fuel"]
         * "Hotel en Santiago" → ["hotel", "alojamiento", "hospedaje", "lodging"]
         * "Almuerzo" → ["comida", "restaurant", "almuerzo", "food", "meal"]
         * "Cambio de aceite" → ["mantenimiento", "reparacion", "taller", "aceite", "service"]

    ## Reglas importantes:
    - NO inventes datos. Si no encuentras algo, usa null.
    - Las keywords son CRÍTICAS para la categorización automática.
    - Usa la descripción del conductor (si está disponible) para hacer keywords más precisas.
    - Sé consistente con las keywords: siempre en minúsculas, sin acentos en lo posible.
    """
)
```

### 6. Actualizar el Nodo de Análisis

```python
def analyze_node(state: GraphState) -> GraphState:
    image_url = state["image_url"]
    conductor_desc = state.get("conductor_description")

    system = SystemMessage(content=SYSTEM_PROMPT)

    # Construir el mensaje del usuario
    user_text = "Extrae los campos del recibo de la imagen."

    # Si hay descripción del conductor, incluirla
    if conductor_desc:
        user_text += f"\n\nDescripción del conductor: \"{conductor_desc}\""
        user_text += "\n\nUsa esta descripción para generar keywords más precisas y contextuales."

    user = HumanMessage(content=[
        {"type": "text", "text": user_text},
        {"type": "image_url", "image_url": {"url": image_url}},
    ])

    parsed: ReceiptSchema = structured_llm.invoke([system, user])
    return {"result": parsed.model_dump()}
```

### 7. Actualizar el Endpoint de FastAPI

```python
@api.post("/analyze-receipt", response_model=ReceiptResponse)
async def analyze_receipt(request: ReceiptRequest) -> Dict[str, Any]:
    """
    Analiza una imagen de recibo y extrae la información estructurada.

    Args:
        request: Objeto con la URL de la imagen y opcionalmente descripción del conductor

    Returns:
        Diccionario con los campos extraídos del recibo incluyendo keywords
    """
    try:
        logger.info(f"Analizando imagen: {request.image_url}")
        if request.conductor_description:
            logger.info(f"Con descripción del conductor: {request.conductor_description}")

        # Invocamos el agente de LangGraph
        result = langgraph_app.invoke({
            "image_url": request.image_url,
            "conductor_description": request.conductor_description
        })

        logger.info(f"Análisis completado. Keywords generadas: {result['result'].get('keywords', [])}")
        return result["result"]

    except Exception as e:
        logger.error(f"Error al procesar la imagen: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la imagen: {str(e)}"
        )
```

## Testing del Agente Actualizado

### Test 1: Sin descripción del conductor

```bash
curl -X POST http://localhost:8000/analyze-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://ejemplo.com/boleta.jpg"
  }'
```

### Test 2: Con descripción del conductor

```bash
curl -X POST http://localhost:8000/analyze-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://ejemplo.com/boleta.jpg",
    "conductor_description": "Peaje de Cristo Redentor camino a Argentina"
  }'
```

### Respuesta Esperada

```json
{
  "referencia": "FAC-123456",
  "razon_social": "AUTOPISTA LIBERTADORES",
  "date": "17/11/2025 14:30:00",
  "total": 15000.0,
  "moneda": "CLP",
  "descripcion": "Peaje autopista",
  "identificador_fiscal": "96123456-7",
  "keywords": ["peaje", "tag", "autopista", "internacional", "cristo redentor", "ruta"]
}
```

## Ejemplo de Keywords Generadas

| Descripción del Conductor | Keywords Esperadas |
|---------------------------|-------------------|
| "Peaje de Cristo Redentor" | ["peaje", "tag", "autopista", "internacional", "cristo redentor"] |
| "Cargué nafta en YPF" | ["combustible", "gasolina", "nafta", "ypf", "fuel"] |
| "Hotel en Mendoza" | ["hotel", "alojamiento", "hospedaje", "mendoza", "lodging"] |
| "Almorcé en ruta" | ["comida", "restaurant", "almuerzo", "food", "meal"] |
| "Arreglé el camión" | ["reparacion", "taller", "mantenimiento", "mecanico", "service"] |

## Notas Importantes

1. **Calidad de Keywords**: El agente debe generar keywords relevantes y útiles para el matching
2. **Idiomas**: Incluir tanto español como inglés cuando sea relevante
3. **Normalización**: Keywords en minúsculas, sin acentos preferiblemente
4. **Cantidad**: 3-5 keywords es el ideal (no muy pocas, no demasiadas)
5. **Contexto**: Usar TANTO la imagen COMO la descripción del conductor para keywords precisas
