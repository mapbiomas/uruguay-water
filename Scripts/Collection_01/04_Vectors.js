// ============================================================
// ES: VECTORIZACION DE AGUA POR CARTA
// EN: WATER VECTORIZATION BY TILE
// ============================================================


// ============================================================
// ES: 1. CONFIGURACION
// EN: 1. CONFIGURATION
// ============================================================

// ES: Para prueba:
// EN: For testing:
// var years = [2000];

// ES: Años incluidos: 2001 y 2002. getInfo transfiere la lista al cliente para crear las tareas.
// EN: Included years: 2001 and 2002. getInfo transfers the list to the client to create tasks.
var years = ee.List.sequence(2001, 2002).getInfo();

// ES: Versión de salida utilizada en los atributos y nombres de los assets.
// EN: Output version used in attributes and asset names.
var versionOut = 1;

var paisName = 'Uruguay';


// ES: Banda utilizada solamente para visualización
// EN: Band used for visualization only
var vis_month = 'w_7';


// ES: Región
// EN: Region
// ES: Este valor se guarda como atributo; no filtra espacialmente el territorio.
// EN: This value is stored as an attribute; it does not spatially filter the territory.
var region = 2;


// ============================================================
// ES: 2. ASSET DE ENTRADA
// EN: 2. INPUT ASSET
// ============================================================

var assetBase =
  'projects/mapbiomas-uruguay/assets/WATER/COLLECTION-1/00-BETA/clasificacion-03';


// ============================================================
// ES: 3. LIMITE DE URUGUAY
// EN: 3. URUGUAY BOUNDARY
// ============================================================

var lim_pais = ee.FeatureCollection(
  'projects/mapbiomas-uruguay/assets/WATER/AUXILIARY_DATA/VECTOR/Limite_Uruguay'
);


// ES: Máscara con valor 1 dentro del país y sin datos fuera del límite.
// EN: Mask with value 1 inside the country and masked pixels outside its boundary.
var maskPais = ee.Image(1)
  .clip(lim_pais);


// ============================================================
// ES: 4. CARTAS / BIGGRIDS
// EN: 4. TILES / BIGGRIDS
// ============================================================

var grids = ee.FeatureCollection(
  'projects/mapbiomas-uruguay/assets/WATER/AUXILIARY_DATA/VECTOR/biggrids-uruguay'
);


// ES: Cartas a procesar
// EN: Tiles to process
var grid_names = [

  'SH-21-Y',
  'SH-21-Z',
  'SH-22-Y',

  'SI-21-V',
  'SI-21-X',
  'SI-22-V',

  'SI-21-Y',
  'SI-21-Z',
  'SI-22-Y'

];


// ES: Para hacer una prueba con una sola carta:
// EN: To test a single tile:
//
// var grid_names = [
//   'SH-21-Y'
// ];


// ============================================================
// ES: 5. SUBGRILLAS
// EN: 5. SUBGRIDS
// ============================================================

var subgrids = ee.FeatureCollection(
  'projects/mapbiomas-raisg/PRODUCTOS/AGUA/DATOS_AUXILIARES/TEMP/sub_grid_0_25_america_sul'
)
.filterBounds(lim_pais);


// ============================================================
// ES: 6. SRTM Y PENDIENTE
// EN: 6. SRTM AND SLOPE
// ============================================================

var srtm = ee.Image(
  'USGS/SRTMGL1_003'
);


// ES: Calcular pendiente en grados a partir de SRTM. No se calcula elevación media.
// EN: Calculate slope in degrees from SRTM. Mean elevation is not calculated.
var slopes = ee.Terrain
  .slope(srtm)
  .rename('slope');


// ============================================================
// ES: 7. VISUALIZACION
// EN: 7. VISUALIZATION
// ============================================================

var pall = [

  '0000ff',
  '009900',
  '5af100',
  'ffffff',
  '000000',
  'ff0000',
  'ff60c7',
  'c6c6c6',
  'ffff00'

];


Map.addLayer(
  lim_pais,
  {},
  'Limite ' + paisName,
  false
);


Map.addLayer(
  grids,
  {},
  'Grids cartas',
  false
);


Map.addLayer(
  subgrids,
  {},
  'Subgrids',
  false
);


// ============================================================
// ES: 8. REDUCER PARA ESTADISTICAS
// EN: 8. STATISTICS REDUCER
// ============================================================
//
// ES: La imagen utilizada en reduceToVectors tendrá:
// EN: The image used in reduceToVectors contains:
//
// ES: banda 1 = label
// EN: band 1 = label
// ES: banda 2 = freq
// EN: band 2 = freq
// ES: banda 3 = slope
// EN: band 3 = slope
//
// ES: reduceToVectors usa la PRIMERA banda para generar
// EN: reduceToVectors uses the FIRST band to generate
// ES: las geometrías.
// EN: the geometries.
//
// ES: El reducer trabaja sobre las bandas restantes:
// EN: The reducer operates on the remaining bands:
//
// freq  -> mean_freq
// slope -> mean_srtm
//
// ES: sharedInputs:false hace que cada reducer trabaje
// EN: sharedInputs:false makes each reducer operate
// ES: con una banda diferente.
// EN: on a different band.
//
// ============================================================

var reducerFreq = ee.Reducer
  .mean()
  .setOutputs([
    'mean_freq'
  ]);


// ES: El nombre mean_srtm se conserva, pero el atributo contiene pendiente media en grados.
// EN: The mean_srtm name is retained, but the attribute contains mean slope in degrees.
var reducerSlope = ee.Reducer
  .mean()
  .setOutputs([
    'mean_srtm'
  ]);


var reducerStats = reducerFreq.combine({

  reducer2: reducerSlope,

  sharedInputs: false

});


// ============================================================
// ES: 9. LOOP POR AÑO
// EN: 9. YEAR LOOP
// ============================================================

years.forEach(function(year) {


  // ==========================================================
  // ES: 9.1 CARGAR IMAGEN NACIONAL
  // EN: 9.1 LOAD NATIONAL IMAGE
  // ==========================================================

  var imagePath =
    assetBase +
    '/water_classif_' +
    year;


  print(
    'Imagen entrada ' + year,
    imagePath
  );


  // ES: Se espera una imagen con bandas mensuales de clasificación; no se seleccionan explícitamente w_1 a w_12.
  // EN: An image with monthly classification bands is expected; w_1 through w_12 are not explicitly selected.
  var col = ee.Image(
    imagePath
  )
  .updateMask(
    maskPais
  );


  // ==========================================================
  // ES: 9.2 VISUALIZACION NACIONAL
  // EN: 9.2 NATIONAL VISUALIZATION
  // ==========================================================

  Map.addLayer(

    col.select(
      vis_month
    ),

    {
      palette: pall,
      min: 1,
      max: 9
    },

    'classif - ' + year,

    false

  );


  // ==========================================================
  // ES: 10. LOOP POR CARTA
  // EN: 10. TILE LOOP
  // ==========================================================

  for (
    var i = 0;
    i < grid_names.length;
    i++
  ) {


    // ========================================================
    // ES: 10.1 NOMBRE DE CARTA
    // EN: 10.1 TILE NAME
    // ========================================================

    var grid_name =
      grid_names[i];


    // ========================================================
    // ES: 10.2 SELECCIONAR CARTA
    // EN: 10.2 SELECT TILE
    // ========================================================

    var grid = grids.filter(

      ee.Filter.eq(
        'grid_name',
        grid_name
      )

    );


    // ES: Se utiliza la primera entidad coincidente; el identificador debe existir y ser único.
    // EN: Use the first matching feature; the identifier must exist and be unique.
    var gridFeature =
      ee.Feature(
        grid.first()
      );


    var gridGeom =
      gridFeature.geometry();


    // ========================================================
    // ES: 10.3 RECORTAR IMAGEN NACIONAL A LA CARTA
    // EN: 10.3 CLIP NATIONAL IMAGE TO TILE
    // ========================================================
    //
    // ES: IMPORTANTE:
    // EN: IMPORTANT:
    //
    // ES: Todo el procesamiento posterior se hace únicamente
    // EN: All subsequent processing is performed only
    // ES: para esta carta.
    // EN: for this tile.
    //
    // ========================================================

    var col_grid = col
      .clip(
        gridGeom
      );


    // ========================================================
    // ES: 10.4 IDENTIFICAR AGUA
    // EN: 10.4 IDENTIFY WATER
    // ========================================================
    //
     //
    // ES: clases 1, 2 y 3 = agua
    // EN: classes 1, 2 and 3 = water
    //
    // ES: La operación se ejecuta sobre todas las bandas.
    // EN: The operation is applied to all bands.
    //
    // ========================================================

    var water_grid = col_grid

      .gte(1)

      .and(

        col_grid.lte(3)

      );


    // ========================================================
    // ES: 10.5 FRECUENCIA DE AGUA
    // EN: 10.5 WATER FREQUENCY
    // ========================================================
    //
    // ES: Suma cuántas bandas/períodos fueron agua.
    // EN: Count how many bands/periods were classified as water.
    //
    // ES: Ejemplo:
    // EN: Example:
    //
    // ES: 0  = nunca agua
    // EN: 0  = never water
    // ES: 1  = agua una vez
    // EN: 1  = water once
    // ...
    // ES: 12 = agua todos los períodos
    // EN: 12 = water in every period
    //
    // ========================================================

    // ES: El rango 0–12 supone exactamente 12 bandas mensuales. Se cuentan clases 1–3, incluidos meses de agua incorporada; no es un porcentaje ni un conteo exclusivo de detecciones directas. Los valores enmascarados no aportan al conteo.
    // EN: The 0–12 range assumes exactly 12 monthly bands. Classes 1–3 are counted, including added-water months; this is neither a percentage nor a count restricted to direct detections. Masked values do not contribute to the count.
    var freq_grid = water_grid

      .reduce(
        ee.Reducer.sum()
      )

      .rename(
        'freq'
      );


    // ========================================================
    // ES: 10.6 MASCARA DE OBJETOS DE AGUA
    // EN: 10.6 WATER OBJECT MASK
    // ========================================================
    //
    // ES: Todo pixel con frecuencia > 0 entra en la vectorización.
    // EN: Every pixel with frequency > 0 enters vectorization.
    //
    // ES: Esta banda define las geometrías.
    // EN: This band defines the geometries.
    //
    // ========================================================

    // ES: La geometría representa la unión temporal del agua: píxeles vecinos pueden haber tenido agua en meses distintos.
    // EN: Geometry represents the temporal union of water: neighboring pixels may have contained water in different months.
    var label_grid = freq_grid

      .gt(0)

      .selfMask()

      .rename(
        'label'
      )

      .toByte();


    // ========================================================
    // ES: 10.7 FRECUENCIA PARA ESTADISTICAS
    // EN: 10.7 FREQUENCY FOR STATISTICS
    // ========================================================

    var freq_for_vectors = freq_grid

      .updateMask(
        label_grid
      )

      .rename(
        'freq'
      );


    // ========================================================
    // ES: 10.8 PENDIENTE
    // EN: 10.8 SLOPE
    // ========================================================

    var slope_grid = slopes

      .clip(
        gridGeom
      )

      .updateMask(
        label_grid
      )

      .rename(
        'slope'
      );


    // ========================================================
    // ES: 10.9 STACK PARA REDUCETOVECTORS
    // EN: 10.9 STACK FOR REDUCETOVECTORS
    // ========================================================
    //
    // ES: MUY IMPORTANTE:
    // EN: VERY IMPORTANT:
    //
    // ES: ORDEN:
    // EN: ORDER:
    //
    // 1 -> label
    // 2 -> freq
    // 3 -> slope
    //
    // ES: label debe ser SIEMPRE la primera banda.
    // EN: label must ALWAYS be the first band.
    //
    // ========================================================

    var vectorStack = label_grid

      .addBands(
        freq_for_vectors
      )

      .addBands(
        slope_grid
      );


    // ========================================================
    // ES: 10.10 SUBGRILLAS DE LA CARTA
    // EN: 10.10 TILE SUBGRIDS
    // ========================================================

    // ES: El buffer negativo de 100 m contrae la carta solo para seleccionar subgrillas por intersección. No recorta sus geometrías ni garantiza por sí solo cubrir todos los bordes.
    // EN: The negative 100 m buffer shrinks the tile only to select intersecting subgrids. It does not clip their geometries or by itself guarantee full edge coverage.
    var subgrids_grid = subgrids

      .filterBounds(

        gridGeom.buffer(-100)

      )

      .filterBounds(

        lim_pais

      );


    // ========================================================
    // ES: CONTROL
    // EN: CHECKS
    // ========================================================

    print(

      'Procesando año / carta',

      year,

      grid_name

    );


    print(

      'Cantidad de subgrillas - ' +
      grid_name,

      subgrids_grid.size()

    );


    // ========================================================
    // ES: 11. PASAR SUBGRILLAS A LISTA
    // EN: 11. CONVERT SUBGRIDS TO A LIST
    // ========================================================
    //
    // ES: Usamos List.map porque cada subgrilla devuelve una
    // EN: Use List.map because each subgrid returns a
    // ES: FeatureCollection.
    // EN: FeatureCollection.
    //
    // ========================================================

    var subgridList =
      subgrids_grid.toList(
        subgrids_grid.size()
      );


    // ========================================================
    // ES: 12. VECTORIALIZAR CADA SUBGRILLA
    // EN: 12. VECTORIZE EACH SUBGRID
    // ========================================================

    var vectorCollections =
      subgridList.map(
        function(subElement) {


          // --------------------------------------------------
          // ES: Feature de la subgrilla
          // EN: Subgrid feature
          // --------------------------------------------------

          var sub =
            ee.Feature(
              subElement
            );


          var subGeom =
            sub.geometry();


          // --------------------------------------------------
          // ES: Recortar stack a la subgrilla
          // EN: Clip stack to subgrid
          // --------------------------------------------------

          var stack_subgrid =
            vectorStack.clip(
              subGeom
            );


          // --------------------------------------------------
          // ES: Vectorización
          // EN: Vectorization
          // --------------------------------------------------
          //
          // ES: Primera banda:
          // EN: First band:
          //
          // ES: label -> genera las geometrías
          // EN: label -> generates geometries
          //
          // ES: Bandas restantes:
          // EN: Remaining bands:
          //
          // freq  -> mean_freq
          // slope -> mean_srtm
          //
          // --------------------------------------------------

          // ES: Vectorizar a 30 m con conectividad de ocho vecinos (incluye diagonales). class guarda la etiqueta binaria 1, no las clases mensuales originales. tileScale ajusta el tamaño de los bloques de cómputo; no cambia la escala nominal.
          // EN: Vectorize at 30 m with eight-neighbor connectivity (including diagonals). class stores the binary label 1, not the original monthly classes. tileScale adjusts computation tile size; it does not change the nominal scale.
          var vectors =
            stack_subgrid.reduceToVectors({

              reducer:
                reducerStats,

              geometry:
                subGeom,

              scale:
                30,

              geometryType:
                'polygon',

              eightConnected:
                true,

              labelProperty:
                'class',

              maxPixels:
                1e13,

              tileScale:
                4

            });


          return vectors;


        }
      );


    // ========================================================
    // ES: 13. UNIR RESULTADOS DE LAS SUBGRILLAS
    // EN: 13. MERGE SUBGRID RESULTS
    // ========================================================

    // ES: flatten reúne las entidades sin disolver sus límites. Los cuerpos de agua que cruzan subgrillas o cartas quedan fragmentados y las medias corresponden a cada fragmento.
    // EN: flatten gathers features without dissolving their boundaries. Water bodies crossing subgrids or tiles remain fragmented, and means describe each fragment.
    var vecs_flattened =
      ee.FeatureCollection(
        vectorCollections
      )
      .flatten();


    // ========================================================
    // ES: 14. AGREGAR ATRIBUTOS
    // EN: 14. ADD ATTRIBUTES
    // ========================================================
    //
    // ES: mean_freq y mean_srtm ya fueron calculados
    // EN: mean_freq and mean_srtm have already been calculated
    // ES: por reduceToVectors.
    // EN: by reduceToVectors.
    //
    // ========================================================

    var vecs_prop =
      vecs_flattened.map(
        function(f) {


          return ee.Feature(f)

            .set(
              'year',
              year
            )

            .set(
              'grid_name',
              grid_name
            )

            .set(
              'region',
              region
            )

            .set(
              'versionOut',
              versionOut
            );


        }
      );


    // ========================================================
    // ES: 15. NOMBRE DE SALIDA
    // EN: 15. OUTPUT NAME
    // ========================================================

    var outputName =

      'water_objs_' +

      year + '_' +

      grid_name + '_' +

      versionOut;


    // ========================================================
    // ES: 16. PATH DE SALIDA
    // EN: 16. OUTPUT PATH
    // ========================================================

    var outputAsset =

      'projects/mapbiomas-uruguay/assets/' +

      'WATER/COLLECTION-1/00-BETA/' +

      'POSTPROCESSING/01-VECT-02/' +

      outputName;


    // print(

    //   'Export:',

    //   outputAsset

    // );


    // ========================================================
    // ES: 17. EXPORTAR
    // EN: 17. EXPORT
    // ========================================================

    // ES: Crear una tarea por año y carta: con esta configuración se crean 18 tareas. Ejecutarlas desde Tasks; el script no las inicia automáticamente.
    // EN: Create one task per year and tile: this configuration creates 18 tasks. Run them from Tasks; the script does not start them automatically.
    Export.table.toAsset({

      collection:
        vecs_prop,

      description:
        outputName,

      assetId:
        outputAsset

    });


  } // ES: Fin del bucle de cartas. / EN: End of tile loop.


}); // ES: Fin del bucle de años. / EN: End of year loop.
