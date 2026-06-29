# Especificación de Valores Ideales y Rutas del Analizador Histórico

Para llevar a cabo análisis históricos complejos (como el cálculo del **RMSE** y la **Integral del Error**), la biblioteca común `utils.s` define en su sección `.data` un conjunto de constantes globales que representan el estado óptimo o "ideal" del invernadero. 

Además, centraliza las rutas relativas donde cada módulo ARM64 exportará sus archivos de texto con los resultados estructurados.

---

## 1. Valores Ideales por Sensor

Estos valores están declarados mediante directivas `.quad` de 64 bits y son utilizados por los diferentes módulos de análisis:

| Símbolo en Ensamblador | Valor de Referencia | Unidad | Justificación Agrícola / Operativa |
| :--- | :---: | :---: | :--- |
| `TEMP_IDEAL` | `24` | °C | Temperatura óptima para la fotosíntesis en cultivos de clima templado durante el día. |
| `HUM_IDEAL` | `70` | % | Humedad relativa del aire que promueve una adecuada transpiración. |
| `SOIL_IDEAL` | `65` | % | Humedad de suelo óptima para el desarrollo y la absorción constante de agua. |
| `LUZ_IDEAL` | `200` | Lux | Intensidad lumínica mínima recomendada para mantener el fotoperíodo activo en plantas de invernadero. |
| `GAS_IDEAL` | `150` | ppm | Concentración típica de gas o humo en un ambiente limpio y con ventilación adecuada. |

---
