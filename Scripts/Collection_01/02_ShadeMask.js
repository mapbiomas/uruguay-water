// edit by rca

// ES: Parámetros del límite territorial de Uruguay.
//     Coleccion corresponde al asset de territorios LULC, no a la colección de Agua.
// EN: Parameters for the Uruguay territorial boundary.
//     Coleccion refers to the LULC territory asset, not to the Water collection.
//***************************************************
var Pais = 'Uruguay' // ES: País. / EN: Country.
var Coleccion = 2;
var Territorio = 'POLITICAL_LEVEL_1' // ES: Límite nacional. / EN: National boundary.
//***************************************************

// ES: Cargar el límite nacional utilizando los parámetros definidos.
// EN: Load the national boundary using the specified parameters.
var region = ee.FeatureCollection('projects/mapbiomas-territories/assets/TERRITORIES/LULC/'+Pais.toUpperCase()+'/COLLECTION'+Coleccion+'/WORKSPACE/'+Territorio)
              // ES: Buffer opcional de 60 m, desactivado.
              // EN: Optional 60 m buffer, disabled.
              //.geometry().buffer(60)

// ES: Pintar el territorio con valor 1 para utilizarlo como máscara espacial.
// EN: Paint the territory with value 1 for use as a spatial mask.
var regionRas = ee.Image().paint(region,1)
Map.addLayer(region,{},'Limite-país');

// ES: Fuentes alternativas conservadas como referencias desactivadas.
// EN: Alternative sources retained as disabled references.
// var regionRaisg = ee.Image('projects/mapbiomas-raisg/DATOS_AUXILIARES/RASTERS/clasificacion-regiones-3')
// var landsatLT05 = ee.ImageCollection("LANDSAT/LT05/C01/T1_SR").filterBounds(region)

// ES: Seleccionar escenas Landsat 5 Collection 2 Level 2 que intersectan Uruguay.
//     Se utilizan sus metadatos solares, sin aplicar filtros de nubes.
//     La fecha final de filterDate es exclusiva: no incluye el 31/12/2006.
// EN: Select Landsat 5 Collection 2 Level 2 scenes intersecting Uruguay.
//     Their solar metadata are used without cloud filtering.
//     The filterDate end date is exclusive: December 31, 2006 is not included.
var landsatLT05 = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2").filterBounds(region)
                                                            .filterDate('2005-01-01', '2006-12-31');

// ES: Seleccionar escenas Landsat 8 para el intervalo indicado.
//     La fecha final también es exclusiva; el intervalo comienza antes de la disponibilidad de L8.
// EN: Select Landsat 8 scenes for the specified interval.
//     The end date is also exclusive; the interval starts before L8 data availability.
var landsatLC08 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2").filterBounds(region)
                                                            .filterDate('2012-01-01', '2013-12-31');

// ES: Función auxiliar para calcular el ángulo cenital solar: 90° menos la elevación solar.
//     Guarda el resultado como propiedad, sin modificar las bandas.
//     En este script la función está definida, pero sus llamadas están desactivadas.
// EN: Helper function to calculate the solar zenith angle: 90° minus solar elevation.
//     Store the result as a property without changing image bands.
//     This function is defined here, but its calls are disabled.
function SEtoZA(img){
  return img.set('SOLAR_ZENITH_ANGLE',ee.Number(90).add(ee.Number(img.get('SUN_ELEVATION')).multiply(-1)))
}

// ES: Inspeccionar la primera escena Landsat 8 y sus metadatos.
// EN: Inspect the first Landsat 8 scene and its metadata.
print(landsatLC08.first())

// ES: Extraer los azimuts solares de Landsat 5, en grados.
// EN: Extract Landsat 5 solar azimuth values, in degrees.
// var list_SAA_L5 = landsatLT05.reduceColumns(ee.Reducer.toList(), ['SOLAR_AZIMUTH_ANGLE']).get('list')
var list_SAA_L5 = landsatLT05.reduceColumns(ee.Reducer.toList(), ['SUN_AZIMUTH']).get('list')

// ES: Alternativas desactivadas para utilizar o calcular el ángulo cenital.
// EN: Disabled alternatives for using or calculating the zenith angle.
// var list_SZA_L5 = landsatLT05.reduceColumns(ee.Reducer.toList(), ['SOLAR_ZENITH_ANGLE']).get('list')
// landsatLT05 = landsatLT05.map(SEtoZA)

// ES: ATENCIÓN: se extrae SUN_ELEVATION, no el ángulo cenital, aunque el nombre contiene SZA.
//     Se conserva esta instrucción original; shade_mask2 interpretará este valor como cenital.
// EN: CAUTION: SUN_ELEVATION is extracted, not the zenith angle, despite the SZA variable name.
//     This original instruction is retained; shade_mask2 will interpret this value as zenith.
var list_SZA_L5 = landsatLT05.reduceColumns(ee.Reducer.toList(), ['SUN_ELEVATION']).get('list')

// ES: Calcular medias aritméticas por escena, sin ponderación por superficie ni fecha.
//     La media del azimut es aritmética, no circular; meanSZA_L5 es una elevación media.
// EN: Calculate arithmetic scene averages without area or date weighting.
//     Azimuth is averaged arithmetically, not circularly; meanSZA_L5 is mean elevation.
var meanSAA_L5 = ee.List(list_SAA_L5).reduce(ee.Reducer.mean())
var meanSZA_L5 = ee.List(list_SZA_L5).reduce(ee.Reducer.mean())
print('meanSAA_L5',meanSAA_L5)
print('meanSZA_L5',meanSZA_L5)

// ES: Extraer los azimuts solares de Landsat 8, en grados.
// EN: Extract Landsat 8 solar azimuth values, in degrees.
// var list_SAA_L8 = landsatLC08.reduceColumns(ee.Reducer.toList(), ['SOLAR_AZIMUTH_ANGLE']).get('list')
var list_SAA_L8 = landsatLC08.reduceColumns(ee.Reducer.toList(), ['SUN_AZIMUTH']).get('list')
// var list_SZA_L8 = landsatLC08.reduceColumns(ee.Reducer.toList(), ['SOLAR_ZENITH_ANGLE']).get('list')
// landsatLC08 = landsatLC08.map(SEtoZA)

// ES: También aquí se extrae elevación solar y se conserva el nombre original SZA.
// EN: Solar elevation is also extracted here, retaining the original SZA name.
var list_SZA_L8 = landsatLC08.reduceColumns(ee.Reducer.toList(), ['SUN_ELEVATION']).get('list')

// ES: Calcular las medias aritméticas de azimut y elevación para Landsat 8.
// EN: Calculate arithmetic mean azimuth and elevation for Landsat 8.
var meanSAA_L8 = ee.List(list_SAA_L8).reduce(ee.Reducer.mean())
var meanSZA_L8 = ee.List(list_SZA_L8).reduce(ee.Reducer.mean())
print('meanSAA_L8',meanSAA_L8)
print('meanSZA_L8',meanSZA_L8)

// ES: Cargar el modelo de elevación SRTM utilizado para modelar las sombras del relieve.
// EN: Load the SRTM elevation model used to model terrain shadows.
var Terrain = ee.Image('USGS/SRTMGL1_003');

// ES: Generar una máscara binaria combinando sombra proyectada e iluminación del relieve.
//     La función espera azimut (SAA) y ángulo cenital (SZA), ambos en grados.
// EN: Generate a binary mask combining cast shadows and terrain illumination.
//     The function expects azimuth (SAA) and zenith angle (SZA), both in degrees.
function shade_mask2 (SAA,SZA) {
    var sunAzimuth = ee.Number(SAA);
    var sunZenith = ee.Number(SZA);

    // ES: Convertir el ángulo interpretado como cenital a elevación para hillshade.
    // EN: Convert the angle interpreted as zenith into elevation for hillshade.
    var sunElevation = ee.Number(90).subtract(sunZenith);

    // ES: Modelar la sombra proyectada: 0 indica sombra y 1 iluminación.
    //     Se utiliza una vecindad de 300 píxeles y se activa la histéresis.
    // EN: Model cast shadows: 0 indicates shadow and 1 illumination.
    //     Use a 300-pixel neighborhood and enable hysteresis.
    var hillShadow = ee.Terrain.hillShadow(Terrain, sunAzimuth , sunZenith, 300, true);

    // ES: Calcular la iluminación del relieve en la escala 0–255.
    // EN: Calculate terrain illumination on the 0–255 scale.
    var hillShade = ee.Terrain.hillshade(Terrain, sunAzimuth , sunElevation);

    // ES: Promediar la máscara de iluminación en una ventana cuadrada de radio 30 m.
    // EN: Average the illumination mask within a square window with a 30 m radius.
    var hillShadow_mean = hillShadow.reduceNeighborhood({
      reducer: ee.Reducer.mean(),
      kernel: ee.Kernel.square(30, 'meters'),
    });

    // ES: Asignar 1 si la iluminación media es ≤0,9 O si hillShade es ≤120;
    //     mantener 0 en el resto. El umbral 120 es un parámetro ajustable.
    //     La máscara identifica las condiciones modeladas, no una clasificación de agua.
    // EN: Assign 1 where mean illumination is ≤0.9 OR hillShade is ≤120;
    //     retain 0 elsewhere. The threshold of 120 is adjustable.
    //     This mask identifies modeled conditions, not a water classification.
    var shadeMask2 = ee.Image(0).where(hillShadow_mean.lte(0.9).or(hillShade.lte(120)),1)
                      // .multiply(1)
                      .toUint8()
                      .rename('shade_mask2');

    // ES: Devolver una única banda con nombre explícito.
    // EN: Return a single band with an explicit name.
    return shadeMask2.select([0], ['shade_mask2']);
}

// ES: Generar las máscaras utilizando los ángulos medios de cada selección de escenas.
//     Persiste la inconsistencia de elevación/cenital indicada arriba.
// EN: Generate masks using mean angles from each scene selection.
//     The elevation/zenith inconsistency described above remains in these calls.
var shade_mask2_L5 = shade_mask2(ee.Number(meanSAA_L5),ee.Number(meanSZA_L5));
var shade_mask2_L8 = shade_mask2(ee.Number(meanSAA_L8),ee.Number(meanSZA_L8));

// ES: Combinar mediante el máximo: basta que una máscara tenga valor 1 para conservarlo.
//     Aunque el nombre termina en med, se calcula el máximo, no la media ni la mediana.
//     Aplicar la máscara territorial y ocultar los ceros mediante selfMask.
//     La salida contiene valor 1 en píxeles seleccionados y el resto queda enmascarado.
// EN: Combine by maximum: a value of 1 in either mask is sufficient to retain it.
//     Despite the med suffix, this computes the maximum, not the mean or median.
//     Apply the territory mask and hide zeros using selfMask.
//     Output pixels contain 1 where selected; all remaining pixels are masked.
var shade_mask2_med = shade_mask2_L5.addBands(shade_mask2_L8)
                                    .reduce('max')
                                    // .clip(region);
                                    .mask(regionRas)
                                    .selfMask()
Map.addLayer(shade_mask2_med,{},'shade_mask2_med')

// ES: Crear la tarea de exportación al asset de sombras, en entero sin signo de 8 bits.
//     Exportar a 30 m y utilizar la moda para los niveles de pirámide.
//     El rectángulo envolvente define la extensión de exportación; la máscara limita los datos.
//     Ejecutar la tarea desde la pestaña Tasks del editor de Earth Engine.
// EN: Create the shadow asset export task using unsigned 8-bit integers.
//     Export at 30 m and use mode for pyramid levels.
//     The bounding rectangle sets the export extent; the mask limits valid data.
//     Run the task from the Tasks tab in the Earth Engine Code Editor.
Export.image.toAsset({
  "image": shade_mask2_med.toUint8(),
  "description": 'shademask2_v3',
  "assetId": 'projects/mapbiomas-'+Pais.toLowerCase()+'/assets/WATER/AUXILIARY_DATA/RASTER/'+'shademask2_v3',
  "scale": 30,
  "pyramidingPolicy": {
      '.default': 'mode'
  },
  "maxPixels": 1e13,
  "region": region.geometry().bounds()
});
