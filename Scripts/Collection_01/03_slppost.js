// ES: Cálculo de posición topográfica relativa (slppost).
// EN: Relative topographic position calculation (slppost).
// BY: EYTC
// UPDATE: RCA
//***************************************************
// ES: País utilizado para construir la ruta del asset de salida.
// EN: Country used to build the output asset path.
var Pais = 'Uruguay'

// ES: Parámetros conservados del script original; no se utilizan para cargar el límite en este código.
//     Coleccion alude a territorios LULC, no al número de colección de Agua.
// EN: Parameters retained from the original script; they are not used to load the boundary here.
//     Coleccion refers to LULC territories, not to the Water collection number.
var Coleccion = 2;
var Territorio = 'POLITICAL_LEVEL_1'
//***************************************************

// ES: Cargar el límite desde el asset fijo de cobertura C5 y aplicar un buffer de 60 m.
//     El ámbito efectivo depende de esta ruta, no de Coleccion ni Territorio.
// EN: Load the boundary from the fixed C5 land-cover asset and apply a 60 m buffer.
//     The effective area depends on this path, not on Coleccion or Territorio.
var geometry = ee.FeatureCollection('projects/mapbiomas-uruguay/assets/LAND-COVER/ANCILLARY_DATA/C5/nivel_politico_1')
              .geometry().buffer(60)

// ES: Pintar la geometría con valor 1 para utilizarla como máscara espacial.
// EN: Paint the geometry with value 1 for use as a spatial mask.
var geometryRas = ee.Image().paint(geometry,1)

// ES: Definir el radio de la ventana cuadrada en píxeles, no su ancho total.
//     Un radio de 30 píxeles corresponde a una ventana de 61 × 61 píxeles.
//     Su dimensión física depende de la escala de procesamiento.
// EN: Define the square window radius in pixels, not its total width.
//     A 30-pixel radius corresponds to a 61 × 61 pixel window.
//     Its physical dimensions depend on the processing scale.
var param = {
    // 'region': 702,
    'kernel': 30
}

// ES: Fuente alternativa de regiones, desactivada.
// EN: Alternative region source, disabled.
// var regions = ee.Image("projects/mapbiomas-raisg/COLECCION2/0_DATOS_AUXILIARES/RASTERS/Region_mos");
//print(regions)

// ES: Cargar la elevación SRTM y aplicar la máscara territorial antes del análisis de vecindad.
//     Cerca del borde, la ventana dispone de menos datos válidos por este enmascaramiento.
// EN: Load SRTM elevation and apply the territorial mask before neighborhood analysis.
//     Near the boundary, the window contains fewer valid observations because of this masking.
// var dem = ee.Image("USGS/SRTMGL1_003").clip(geometry);
var dem = ee.Image("USGS/SRTMGL1_003").mask(geometryRas)//.selfMask();

// ES: Calcular la elevación mínima dentro de la ventana de cada píxel.
//     Es un mínimo local; no implica la identificación de un valle geomorfológico.
// EN: Calculate the minimum elevation within each pixel's window.
//     This is a local minimum; it does not imply identification of a geomorphological valley.
var valleyElev = dem.reduceNeighborhood({
  reducer: ee.Reducer.min(),
  kernel: ee.Kernel.square(param.kernel),
});

// ES: Calcular la elevación máxima en la misma ventana.
//     Es un máximo local; no implica la identificación de una divisoria.
// EN: Calculate the maximum elevation within the same window.
//     This is a local maximum; it does not imply identification of a drainage divide.
var ridgeElev = dem.reduceNeighborhood({
  reducer: ee.Reducer.max(),
  kernel: ee.Kernel.square(param.kernel),
});

// ES: Numerador: altura del píxel respecto al mínimo local.
// EN: Numerator: pixel elevation above the local minimum.
var imTop = dem.subtract(valleyElev);

// ES: Denominador: amplitud altitudinal local (máximo menos mínimo).
//     Si toda la ventana tiene igual elevación, el denominador es cero y
//     la posición relativa no está matemáticamente definida.
//     La alternativa de reemplazar ceros permanece desactivada.
// EN: Denominator: local elevation range (maximum minus minimum).
//     If the entire window has the same elevation, the denominator is zero and
//     relative position is mathematically undefined.
//     The alternative for replacing zeros remains disabled.
var imBottom = ridgeElev.subtract(valleyElev);
//var imBottomClean = imBottom.where(imBottom.eq(0), 1);

// ES: Normalizar la posición relativa: 100 × (elevación − mínimo) / (máximo − mínimo).
//     Para ventanas con relieve, 0 corresponde al mínimo y 100 al máximo local.
//     Se suma 0,5 antes de convertir a entero para redondear los valores no negativos.
//     Este índice no representa pendiente en grados ni pendiente porcentual.
// EN: Normalize relative position: 100 × (elevation − minimum) / (maximum − minimum).
//     For windows with elevation variation, 0 is the local minimum and 100 the local maximum.
//     Add 0.5 before integer conversion to round nonnegative values.
//     This index is neither slope in degrees nor percent slope.
var slppost = ee.Image(imTop.divide(imBottom)).multiply(100).add(ee.Image(0.5));//.byte().rename('slppost');

// ES: Suavizado espacial opcional mediante media en una ventana de radio 60 m, desactivado.
// EN: Optional spatial smoothing using a mean within a 60 m radius window, disabled.
// var slppost2 = slppost.reduceNeighborhood({
//   reducer: ee.Reducer.mean(),
//   kernel: ee.Kernel.square(60, 'meters'),
// }).byte().rename('slppost');

// ES: Convertir directamente a entero sin signo de 8 bits y asignar el nombre de banda.
// EN: Convert directly to unsigned 8-bit integers and assign the band name.
var slppost2 = slppost.byte().rename('slppost');

// ES: Importar las paletas para la visualización; se requiere acceso al módulo externo.
// EN: Import visualization palettes; access to the external module is required.
var palettes = require('users/gena/packages:palettes');

// ES: Bloque desactivado para dibujar contornos de unidades operativas, regiones y cartas.
//     Para activarlo se necesitan las colecciones Operativos, Regiones y Cartas.
// EN: Disabled block for drawing operational unit, region and tile outlines.
//     Enabling it requires the Operativos, Regiones and Cartas collections.
/*
var grid15_1 = ee.Image().byte();
var outlinegrid = grid15_1.paint({
    featureCollection: Operativos,
    color: 1,
    width: 2
});

var grid15_2 = ee.Image().byte();
var outlinegrid2 = grid15_2.paint({
    featureCollection: Regiones,
    color: 1,
    width: 2
});

var grid15_3 = ee.Image().byte();
var outlinegrid3 = grid15_3.paint({
    featureCollection: Cartas,
    color: 1,
    width: 2
});
*/

// ES: Referencia aislada conservada; no agrega ninguna capa ni modifica la máscara.
// EN: Standalone reference retained; it neither adds a layer nor changes the mask.
geometryRas
//Map.addLayer(geometryRas, null, "pais");

// ES: Visualizar la elevación entre 0 y 500 m y el índice entre 0 y 100.
//     Estos límites afectan la representación, no recortan los valores del cálculo.
// EN: Display elevation from 0 to 500 m and the index from 0 to 100.
//     These limits affect visualization, not the computed values.
Map.addLayer(dem, {max:500, min:0, palette:palettes.misc.jet[7]}, 'dem');
Map.addLayer(slppost2, {max:100, min:0, palette:palettes.misc.jet[7]}, 'slppost');

// ES: Visualización opcional de los contornos, desactivada.
// EN: Optional outline visualization, disabled.
/*
Map.addLayer(outlinegrid3, {
    palette: '#cc54ce'
}, 'Cartas',false);

Map.addLayer(outlinegrid2, {
    palette: '#ffffff'
}, 'Regiones',false);

Map.addLayer(outlinegrid, {
    palette: '#070707'
}, 'Operativos',false);
*/

// ES: Crear la tarea de exportación a 30 m, convirtiendo a entero con signo de 8 bits.
//     El rango esperado de 0–100 cabe en este tipo de dato.
//     La moda se utiliza para construir los niveles de pirámide del asset.
//     La descripción termina en v3, pero el asset de destino termina en v5;
//     ambos nombres se conservan tal como aparecen en el código original.
//     La extensión de exportación incluye el buffer de 60 m del ámbito.
//     Ejecutar la tarea desde la pestaña Tasks del editor de Earth Engine.
// EN: Create the export task at 30 m, converting to signed 8-bit integers.
//     The expected 0–100 range fits within this data type.
//     Mode is used to build the asset's pyramid levels.
//     The description ends in v3, while the destination asset ends in v5;
//     both names are retained exactly as in the original code.
//     The export extent includes the area's 60 m buffer.
//     Run the task from the Tasks tab in the Earth Engine Code Editor.
Export.image.toAsset({
  "image": slppost2.toInt8(),
  "description": 'slppost2_30_v3',
  "assetId": 'projects/mapbiomas-'+Pais.toLowerCase()+'/assets/WATER/AUXILIARY_DATA/RASTER/'+'slppost2_30_v5',
  "scale": 30,
  "pyramidingPolicy": {
      '.default': 'mode'
  },
  "maxPixels": 1e13,
  "region": geometry.bounds()
});
