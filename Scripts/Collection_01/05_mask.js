/ ES: País utilizado en las rutas y metadatos de salida.
// EN: Country used in output paths and metadata.
var paisName = 'Uruguay'; // Ecuador, Perú, Bolivia, Venezuela, Colombia, Suriname, Guiana Francesa, Guyana   
 //var years = [1992]; 
// ES: Años a procesar: únicamente 1992. getInfo obtiene una lista del lado del cliente para crear las tareas.
// EN: Years to process: only 1992. getInfo retrieves a client-side list to create tasks.
var years = ee.List.sequence(1992,1992).getInfo()
// ES: Versión de salida; no filtra las versiones de los insumos.
// EN: Output version; it does not filter input versions.
var version = 1  // ES: Versión de salida. / EN: Output version.
// ES: Parámetro de nubosidad enviado al módulo externo. Su aplicación exacta depende de get_Collection2.
// EN: Cloud-cover parameter passed to the external module. Its exact application depends on get_Collection2.
var cloud_cover = 70; 
 
// var region_class = 20201

// var reg_clasif = {'Amazonia baja':[20201,20202,20203,20204,20205,20206,20207,20208,20209],
// 'Chiquitano':[21001,21002,21003,21004],
// 'Pantanal':[20501],
// 'Chaco':[21101,21102,21102],
// 'Tucumano-Boliviano':[21201,21202],
// 'Andes':[20601,20602,20603,20604,20605,20606],
// 'Amazonia alta':[20101,20102,20103],
// }
// var region_interes = 'Tucumano-Boliviano'

// ES: Activar o desactivar la exclusión adicional por clases de cobertura. Los filtros de frecuencia, pendiente, csf y soil se aplican igualmente.
// EN: Enable or disable additional exclusion by land-cover class. Frequency, slope, csf and soil filters still apply.
var useMask_Mapbiomas = false // ES: Exclusión por cobertura. / EN: Land-cover exclusion.
// ES: Controlar la visualización y los meses mostrados. No se aplica una selección de carta en este bloque.
// EN: Control visualization and displayed months. No tile selection is applied in this block.
var vis = { // ES: Opciones de visualización. / EN: Display options. 
      Map_addLayer: true,
      listbandMonth: [  // ES: Meses a visualizar. / EN: Months to display.
                    // 'w_1',
                    // 'w_2',
                    // 'w_3','w_4',
                    // 'w_5',
                    //'w_8',
                     'w_7',
                    // 'w_8',
                    // 'w_9','w_10',
                    // 'w_11',
                    // 'w_12'
                    ]
  }
// ES: Lista vacía conservada; no se utiliza posteriormente. Las alternativas regionales comentadas permanecen desactivadas.
// EN: Empty list retained; it is not used later. Commented regional alternatives remain disabled.
var Vectores_Sin_NombVer = []  

//var grids = ee.FeatureCollection('projects/mapbiomas-'+ paisName.toLowerCase() +'/assets/WATER/AUXILIARY_DATA/VECTOR/biggrids-paraguay'); //Modo 1
// ES: Cargar las cartas de Uruguay. Esta variable no interviene en los filtros ni en la exportación de este script.
// EN: Load Uruguay tiles. This variable is not used in filtering or export in this script.
var grids = ee.FeatureCollection('projects/mapbiomas-uruguay/assets/WATER/AUXILIARY_DATA/VECTOR/biggrids-uruguay'); // ES: Fuente activa. / EN: Active source.

//var asset_classif = 'projects/mapbiomas-'+ paisName.toLowerCase() +'/assets/WATER/COLLECTION-1/00-BETA/clasificacion-01'
// ES: Colección de clasificación mensual de entrada; se esperan bandas w_1 a w_12 y propiedad year.
// EN: Input monthly classification collection; w_1 through w_12 bands and a year property are expected.
var asset_classif = 'projects/mapbiomas-uruguay/assets/WATER/COLLECTION-1/00-BETA/clasificacion-03'


// var paises = ee.FeatureCollection("projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-4");
// var pais = paises.filter(ee.Filter.eq('pais', paisName));
//var pais = ee.FeatureCollection('projects/mapbiomas-territories/assets/TERRITORIES/LULC/'+ paisName.toUpperCase() +'/COLLECTION3/WORKSPACE/POLITICAL_LEVEL_1') //Modo 1
// ES: Límite nacional utilizado para consultar imágenes y definir la extensión de exportación.
// EN: National boundary used to query imagery and define the export extent.
var pais = ee.FeatureCollection('projects/mapbiomas-uruguay/assets/WATER/AUXILIARY_DATA/VECTOR/Limite_Uruguay') // ES: Fuente activa. / EN: Active source.

// ES: Usar el país como referencia espacial de salida. Exportar su rectángulo envolvente no equivale a recortar por su contorno.
// EN: Use the country as the output spatial reference. Exporting its bounding rectangle is not equivalent to clipping to its outline.
var region_export_vect = pais


// -----SR-------------------------------------------------------------------------------------------------------------------   

// ES: Importar el módulo externo de imágenes y variables espectrales. Su código no está incluido en este archivo.
// EN: Import the external imagery and spectral-variable module. Its code is not included in this file.
var modules = require('users/schirmbeckj/MBAguaConeSul:Map001_module_month_water_py');

// ES: Obtener referencias a las funciones del módulo. Las llamadas explícitas a NDWImf y mNDWI permanecen desactivadas.
// EN: Get references to module functions. Explicit calls to NDWImf and mNDWI remain disabled.
var get_Collection = modules.get_Collection2;
var get_csf = modules.csf;
var get_NDWImf =modules.NDWImf;
var get_mNDWI =modules.mNDWI;

// ES: Consultar la colección para el rectángulo del país, el parámetro de nubosidad y los años indicados.
// EN: Query the collection for the country bounding rectangle, cloud-cover parameter and selected years.
var Collection_all = get_Collection(pais.geometry().bounds(),cloud_cover,years);
// var Collection_all = get_Collection(geometry3,cloud_cover,years);

// // // ----TOA--------------------------------------------------------------------------------------------------------------------- 
// // var module1 = require('users/rcamargo/MBAgua_C1:02_CLASIF-COL2/Map001_module_mosaic_andes1 (prueba)');
// // var modulo = module1
// // var get_Collection1 = modulo.get_Collection3;


// //var get_csf = modules.csf;
// var get_NDWImf1 = modulo.NDWImf;
// var get_mNDWI1 = modulo.mNDWI;

// var Collection_all1 = get_Collection1(region_export_vect.geometry().bounds());
//----------------------------------------------------------------------------------------------------------------------------
// ES: Cargar SRTM y calcular pendiente. La variable slopes no se utiliza después; el filtro usa el atributo vectorial mean_srtm.
// EN: Load SRTM and calculate slope. The slopes variable is not used later; filtering uses the vector mean_srtm attribute.
var srtm = ee.Image("USGS/SRTMGL1_003");
var slopes = ee.Terrain.slope(srtm);

// ES: Umbrales: frecuencia media del objeto ≥1,8; recuperación por frecuencia del píxel ≥8; mean_srtm <20. Con los vectores del paso anterior, mean_srtm es pendiente media en grados, no elevación.
// EN: Thresholds: object mean frequency ≥1.8; recovery by pixel frequency ≥8; mean_srtm <20. With vectors from the preceding step, mean_srtm is mean slope in degrees, not elevation.
var threshold_freq_mean = 1.8; 
var threshold_freq_recap = 8; // 8
var threshold_srtm_mean = 20; // 20

// --------------------------------------------------------------------------------------------------------------------------   

// ES: Cargar cada tabla y asignar year a la colección a partir de la ruta. split toma el quinto fragmento de la ruta completa separado por guiones bajos: depende de la nomenclatura exacta. El filtro tras flatten utiliza los atributos de las entidades; se espera que estas ya tengan year.
// EN: Load each table and assign a collection-level year parsed from the path. split takes the fifth underscore-separated part of the full path: this depends on the exact naming convention. Filtering after flatten uses feature attributes; features are expected to already have year.
function list_folder_to_featColl(e) {
  var path = e.id;
  var yearPosition = ee.String (path.split('_')[4]); //75, 79 (72, 76) //74, 78          path.substring(74, 78)         
  var fc = ee.FeatureCollection(path)
  .set('year', ee.Number.parse(yearPosition));
  
  return fc; 
}

// ES: Procesar cada año y crear una tarea de exportación por año.
// EN: Process each year and create one export task per year.
for (var i=0; i<years.length; i++) {
  var year = years[i];
  var start = String(year) + '-01-01';
  var end = String(year) + '-12-31';
  
  // ES: Filtrar las escenas del año y aplicar csf. La fecha final 31 de diciembre es exclusiva.
  // EN: Filter scenes for the year and apply csf. The December 31 end date is exclusive.
  var CollectionYear = Collection_all.filterDate(start,end)
                                     .map(get_csf)
                                    // .map(get_NDWImf)
                                    // .map(get_mNDWI);
                                    
  // ES: Calcular medianas anuales por banda. csf y soil controlan la exclusión; las otras medianas se conservan para inspección o alternativas desactivadas. Las bandas deben existir tras el procesamiento del módulo.
  // EN: Calculate annual band medians. csf and soil control exclusion; other medians are retained for inspection or disabled alternatives. The bands must exist after module processing.
  var shade_year = CollectionYear.select('shade').median();
  var csf_year = CollectionYear.select('csf').median();
  var soil_year = CollectionYear.select('soil').median();
  var cloud_year = CollectionYear.select('cloud').median()//.clip(cloud_mask);
  var gv_year = CollectionYear.select('gv').median();
   var ndwi_mcfeeters_year = CollectionYear.select('ndwi_mcfeeters').median();
  var mndwi_year = CollectionYear.select('mndwi').median();
  // Map.addLayer(csf_year,{},'csf_year')
  
  
  //-----------------------------------------------------------------------------------------------------------------------------------------
  // ES: Cargar la referencia de cobertura de Uruguay. La ruta corresponde a collection2 de cobertura, no a la colección de Agua.
  // EN: Load the Uruguay land-cover reference. The path refers to land-cover collection2, not the Water collection.
  var mapbiomas = ee.Image('projects/mapbiomas-public/assets/uruguay/collection2/mapbiomas_uruguay_collection2_integration_v1')
  
  // ES: Copiar 2024 como referencia para 2025 y seleccionar el año del bucle. Esta copia no representa una clasificación independiente de 2025 y requiere que classification_2024 exista.
  // EN: Copy 2024 as the 2025 reference and select the loop year. This copy is not an independent 2025 classification and requires classification_2024 to exist.
  mapbiomas = mapbiomas.addBands(mapbiomas.select('classification_2024').rename('classification_2025'))
                       .select('classification_'+year)
                       .selfMask()
  // ----------------------------------------------------------------------------------------------------------------------------------------------------   

  // var folder = 'projects/mapbiomas-raisg/PRODUCTOS/AGUA/' + paisName.replace('ú', 'u').toUpperCase() + '/BETA/ANDES_VECS_1';
  // var folder = 'projects/mapbiomas-raisg/MAPBIOMAS-WATER/COLECCION2/' + paisName.toUpperCase() + '/POSTPROCESSING/01-VECT-01/'; // Coleccion 2 agua
  // ES: Carpeta de objetos vectoriales generados en la etapa previa. Se requieren mean_freq, mean_srtm y year en las entidades.
  // EN: Folder containing vector objects from the preceding stage. Features require mean_freq, mean_srtm and year.
  var folder = 'projects/mapbiomas-'+ paisName.toLowerCase() +'/assets/WATER/COLLECTION-1/00-BETA/POSTPROCESSING/01-VECT-02/'; 

  
  
  // ES: Listar los assets y reunir sus entidades para el año actual. No se aplica un filtro activo por versión.
  // EN: List assets and gather their features for the current year. No active version filter is applied.
  var lista1 = ee.data.listAssets(folder)
  var listaAsset1 = lista1['assets']
  print('listaAsset1',listaAsset1)
  
  var list = listaAsset1.map(list_folder_to_featColl);
  list = ee.FeatureCollection(list).flatten().filter(ee.Filter.eq('year', year))
        //.filter(ee.Filter.inList('version', versiones))

  // ES: Intentar leer una segunda página. No hay un bucle para páginas adicionales; la condición solo descarta null, no undefined. Se conserva la implementación original de paginación.
  // EN: Attempt to read a second page. There is no loop for additional pages; the condition excludes only null, not undefined. The original pagination implementation is retained.
  if(lista1.nextPageToken !== null){
    var lista2 = ee.data.listAssets(folder, {pageToken: lista1.nextPageToken})
    var listaAsset2 = lista2['assets']
    
    var list2 = listaAsset2.map(list_folder_to_featColl);
    list2 = ee.FeatureCollection(list2).flatten().filter(ee.Filter.eq('year', year));
    list =list.merge(list2)
    
    print('listaAsset2',listaAsset2)
  }
  print('list_grid',list.size())
  // print(list)
  // list = list.toList(list.size());
  
  // var tables_merged = ee.List(list).iterate(
  //   function (table, tables_merged) {
  //     return ee.FeatureCollection(tables_merged).merge(table);
  //   },
  //   ee.FeatureCollection([])
  //   );
  
  // tables_merged = ee.FeatureCollection(tables_merged);
  var tables_merged = list
  
  
  // ES: Seleccionar las imágenes por year y construir el mosaico mensual. selfMask oculta ceros; no selecciona únicamente agua.
  // EN: Select images by year and build the monthly mosaic. selfMask hides zeros; it does not select water only.
  var water = ee.ImageCollection(asset_classif).filter(ee.Filter.eq('year', year))
  //                 //.filter(ee.Filter.eq('version', version))
                  .mosaic().selfMask()
  print('water',water)
  
  
  // ES: Contar las bandas con clases 1–3. El rango 0–12 supone 12 bandas mensuales; selfMask oculta el conteo cero.
  // EN: Count bands with classes 1–3. A 0–12 range assumes 12 monthly bands; selfMask hides zero counts.
  var freq_year = water.gte(1).and(water.lte(3)).reduce('sum').selfMask().rename('freq');  
  
  // ES: Rasterizar las medias por objeto. firstNonNull toma un valor no nulo en solapes, sin promediar objetos superpuestos. Las medias describen los fragmentos vectoriales de entrada.
  // EN: Rasterize object means. firstNonNull takes a non-null value in overlaps without averaging overlapping objects. Means describe the input vector fragments.
  var mean_freq_img = tables_merged.reduceToImage(['mean_freq'], ee.Reducer.firstNonNull());
  var srtm_mean_img = tables_merged.reduceToImage(['mean_srtm'], ee.Reducer.firstNonNull());
  
  // ES: Aceptar por frecuencia media del objeto y pendiente; la segunda regla recupera píxeles con frecuencia ≥8, manteniendo la misma restricción de pendiente.
  // EN: Accept by object mean frequency and slope; the second rule recovers pixels with frequency ≥8 while retaining the same slope restriction.
  var ok_img = mean_freq_img.gte(threshold_freq_mean).and(srtm_mean_img.lt(threshold_srtm_mean));
  ok_img = ok_img.addBands(freq_year.gte(threshold_freq_recap).and(srtm_mean_img.lt(threshold_srtm_mean))).reduce(ee.Reducer.max());
  
  //Map.addLayer (mean_freq_img, {palette: ['ffffff','04fff4','0c2aff','001b9d'], min:1,max:12}, 'mean_freq_img');
  //Map.addLayer (srtm_mean_img, {palette: ['ffffff','04fff4','0c2aff','001b9d'], min:1,max:40}, 'srtm_mean_img');
  //Map.addLayer (freq_year, {palette: ['ffffff','04fff4','0c2aff','001b9d'], min:1,max:12}, 'freq_year');
  //Map.addLayer (csf_year, {palette: ['ffffff','04fff4','0c2aff','001b9d'], min: 0, max:1}, 'csf_year');
  //Map.addLayer (ok_img, {palette: ['000000','1921ff'], min: 0, mas: 1 }, 'ok_img') ; 
    
  // ES: Procesar los doce meses, independientemente de los meses elegidos para visualizar.
  // EN: Process all twelve months, regardless of the months selected for display.
  var months = [1,2,3,4,5,6,7,8,9,10,11,12];
  
  var water_month_col = months.map(function (month) {
    
    var water_month = water
                      .select('w_' + month);
  
    // ES: Primer control. / EN: First check. 
    // ES: Marcar donde ok_img vale cero. Las zonas sin datos en ok_img no se convierten automáticamente en exclusiones.
    // EN: Mark where ok_img equals zero. Areas masked in ok_img are not automatically converted into exclusions.
    var mask_freq = ok_img.eq(0).selfMask();
    
    // ES: Filtrado de las clases de agua. / EN: Water-class filtering. 
    // ES: Aplicar a clase 1 tres causas de reemplazo por clase 4: rechazo de frecuencia/pendiente; csf ≤0,35 O (frecuencia ≤3 Y csf ≤0,7); soil ≥20. csf y soil son medianas anuales, no valores del mes. La escala de soil depende del módulo externo.
    // EN: Apply three reasons for replacing class 1 with class 4: frequency/slope rejection; csf ≤0.35 OR (frequency ≤3 AND csf ≤0.7); soil ≥20. csf and soil are annual medians, not monthly values. The soil scale depends on the external module.
    var detet   = water_month.eq(1).multiply(1).selfMask().where(mask_freq.eq(1), 4)
                                                          .where(csf_year.lte(0.35).or(freq_year.lte(3).and(csf_year.lte(0.7))), 4)
                                                          .where(soil_year.gte(20), 4)


    // ES: Aplicar los mismos criterios a clase 2; conservar 2 donde no se cumple una causa de exclusión.
    // EN: Apply the same criteria to class 2; retain 2 where no exclusion condition is met.
    var fil_1   = water_month.eq(2).multiply(2).selfMask().where(mask_freq.eq(1), 4)
                                                          .where(csf_year.lte(0.35).or(freq_year.lte(3).and(csf_year.lte(0.7))), 4)
                                                          .where(soil_year.gte(20), 4)


    // ES: Aplicar los mismos criterios a clase 3; conservar 3 donde no se cumple una causa de exclusión.
    // EN: Apply the same criteria to class 3; retain 3 where no exclusion condition is met.
    var fil_2   = water_month.eq(3).multiply(3).selfMask().where(mask_freq.eq(1), 4)
                                                          .where(csf_year.lte(0.35).or(freq_year.lte(3).and(csf_year.lte(0.7))), 4)
                                                          .where(soil_year.gte(20), 4)

  
    // ES: Combinar los resultados de las tres clases inicialmente consideradas agua.
    // EN: Combine results for the three classes initially treated as water.
    var water0 = detet.blend(fil_1).blend(fil_2);
    
    // var img_ref = water_month.mask(water_month.eq(0).or(water_month.eq(3)).or(water_month.eq(4)));
    // ES: Conservar las clases originales 4–9. La máscara de esta referencia no incluye las clases 1–3.
    // EN: Retain original classes 4–9. This reference mask excludes classes 1–3.
    var img_ref = water_month.mask(water_month.eq(4)
                              .or(water_month.eq(5))
                              .or(water_month.eq(6))
                              .or(water_month.eq(7))
                              .or(water_month.eq(8))
                              .or(water_month.eq(9)));

    // ES: Reconstruir el mes con las clases filtradas y las clases de referencia conservadas.
    // EN: Reconstruct the month using filtered classes and retained reference classes.
    return water0.blend(img_ref).rename('w_' + month).set('system:index', 'w_' + month);
  });
  
  water_month_col = ee.ImageCollection.fromImages(water_month_col);
  
  // ES: Reunir los doce meses y asignar nombres w_1 a w_12 en orden.
  // EN: Combine all twelve months and assign w_1 through w_12 names in order.
  var water_img = water_month_col.toBands().select(0,1,2,3,4,5,6,7,8,9,10,11)
  .rename('w_1', 'w_2', 'w_3', 'w_4', 'w_5', 'w_6', 'w_7', 'w_8', 'w_9', 'w_10', 'w_11', 'w_12').set('year', year);
  water_img = water_img//.updateMask(region_export_rast)
  
  var color = ['ffffff','063cff','13ff10','ff0000','000000'];
  
// ES: Paleta de cobertura conservada; esta variable no se utiliza en las capas activas.
// EN: Land-cover palette retained; this variable is not used in active layers.
var paletaPais = ['ffffff', '129912', '1f4423', '006400', '00ff00', '687537', '76a5af',//6
'29eee4', '77a605', '935132', 'bbfcac', '45c2a5', 'b8af4f', 'f1c232',//13 
'ffffb2', 'ffd966', 'f6b26b', 'f99f40', 'e974ed', 'd5a6bd', 'c27ba0',//20
'fff3bf', 'ea9999', 'dd7e6b', 'aa0000', 'ff99ff', '0000ff', '5c5c5c',//27
'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff',//34
'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff',//41
'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff',//48
'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff',//55
'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', 'F5D5D5', '4fd3ff',//62
'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff',//69
'D3dc3d', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff',//76
];
  print ('year ' + year, water_img); 
  // Map.addLayer (water_img, {bands: 'w_7', palette: color, min:0,max:4}, 'just water');
  
  // print('poly_exclu',poly_exclu)
  // ES: DEPENDENCIA: poly_exclu debe estar definido o importado como colección con atributo clase. Esta línea se ejecuta incluso cuando useMask_Mapbiomas es false.
  // EN: DEPENDENCY: poly_exclu must be defined or imported as a collection with a clase attribute. This line executes even when useMask_Mapbiomas is false.
  var exclusionRegions =  ee.FeatureCollection(poly_exclu).reduceToImage(['clase'], ee.Reducer.first()).eq(1)
  print('exclusionRegions',exclusionRegions)
  
  // ES: Exclusión opcional: clases de cobertura 12, 13, 25 y 3 dentro de polígonos clase=1; clase 34 sin esa restricción espacial. Solo se reemplazan clases de agua 1–3 por 4.
  // EN: Optional exclusion: land-cover classes 12, 13, 25 and 3 within clase=1 polygons; class 34 without that spatial restriction. Only water classes 1–3 are replaced with 4.
  if(useMask_Mapbiomas){
  var water_img2 = water_img.where((water_img.gte(1).and(water_img.lte(3))).and(exclusionRegions.eq(1)).and(mapbiomas.eq(12)), 4)
                            .where((water_img.gte(1).and(water_img.lte(3))).and(exclusionRegions.eq(1)).and(mapbiomas.eq(13)), 4)
                            .where((water_img.gte(1).and(water_img.lte(3))).and(exclusionRegions.eq(1)).and(mapbiomas.eq(25)), 4)
                            .where((water_img.gte(1).and(water_img.lte(3))).and(exclusionRegions.eq(1)).and(mapbiomas.eq(3)), 4)
                           .where((water_img.gte(1).and(water_img.lte(3))).and(mapbiomas.eq(34)), 4)
  }
  
  // ES: Agregar capas de inspección para los meses seleccionados. La disponibilidad de mosaicos y su escala radiométrica dependen de la colección del módulo.
  // EN: Add inspection layers for selected months. Mosaic availability and radiometric scale depend on the module collection.
  if(vis.Map_addLayer){
    vis.listbandMonth.forEach(function(bandMonth){
        var month= parseInt(bandMonth.split('_')[1])
        var start = ee.Date.fromYMD(year, month, 1);
        var end = start.advance(1, 'month');
          Map.addLayer(CollectionYear.filterDate(start, end).median(),{"bands":["swir1","nir","red"],"min":200,"max":4000},'mosaic-'+month+'-'+year,false);
          Map.addLayer(CollectionYear.filterDate(start, end).median(), {"bands":["swir1","nir","red"],'gain': [0.08, 0.06, 0.2],'gamma': 0.65}, 'mosaico LC2',false)
          // Map.addLayer(CollectionYear1.filterDate(start, end).median(),{"bands":["swir1","nir","red"],"min":200,"max":4000},'mosaic-'+month+'-'+year,false);
          // Map.addLayer(CollectionYear1.filterDate(start, end).median(), {"bands":["swir1","nir","red"],'gain': [0.08, 0.06, 0.2],'gamma': 0.65}, 'mosaico LC2',false)
          
          // Map.addLayer (csf_year.lte(0.10).or(freq_year.lte(3).and(csf_year.lte(0.9))).selfMask(), {palette: 'blue'}, 'csf_year1-freq5',false);
          // Map.addLayer (csf_year.lte(0.25).or(freq_year.lte(3).and(csf_year.lte(0.8))).selfMask(), {palette: 'yellow'}, 'csf_year2_freq5',false);   
          // Map.addLayer (csf_year.lte(0.10).or(freq_year.lte(3).and(csf_year.lte(0.9))).selfMask(), {palette: 'red'}, 'csf_year1_freq4',false);// amazonia alta
          // Map.addLayer (csf_year.lte(0.25).or(freq_year.lte(3).and(csf_year.lte(0.8))).selfMask(), {palette: 'green'}, 'csf_year2_freq4',false);
           
            // ES: La capa amarilla usa frecuencia ≤4; la roja usa ≤3 y coincide con el criterio csf aplicado al filtrado.
            // EN: The yellow layer uses frequency ≤4; the red layer uses ≤3 and matches the csf filtering criterion.
            Map.addLayer (csf_year.lte(0.35).or(freq_year.lte(4).and(csf_year.lte(0.7))).selfMask(), {palette: 'yellow'}, 'csf_year_exclu-freq5',false);
            Map.addLayer (csf_year.lte(0.35).or(freq_year.lte(3).and(csf_year.lte(0.7))).selfMask(), {palette: 'red'}, 'csf_year_exclu-base',false);


          Map.addLayer(water.select(bandMonth),{"min":1,"max":9,"palette":['0000ff','009900','5af100','ffffff','000000','ff0000','ff60c7','c6c6c6','ffff00']},'clasif-pilot-4'+bandMonth,false);
          Map.addLayer(water_img.select(bandMonth),{"min":1,"max":9,"palette":['0000ff','009900','5af100','ffffff','000000','ff0000','ff60c7','c6c6c6','ffff00']},'clasif-'+bandMonth,false);

        if(useMask_Mapbiomas){
          Map.addLayer(water_img2.select(bandMonth),{"min":1,"max":9,"palette":['0000ff','009900','5af100','ffffff','000000','ff0000','ff60c7','c6c6c6','ffff00']},'clasif-mask-'+bandMonth,false);
          Map.addLayer(mapbiomas,{min:0, max:34, palette:['ffffff', '129912', '1f4423', '006400', '00ff00', '687537', '76a5af',
                                            '29eee4', '77a605', '935132', 'bbfcac', '45c2a5', 'b8af4f', 'f1c232', 
                                            'ffffb2', 'ffd966', 'f6b26b', 'f99f40', 'e974ed', 'd5a6bd', 'c27ba0',
                                            'fff3bf', 'ea9999', 'dd7e6b', 'aa0000', 'ff99ff', '0000ff', 'd5d5e5',
                                            'dd497f', 'b2ae7c', 'af2a2a', '8a2be2', '968c46', '0000ff', '4fd3ff']},'mapbiomasRaisg-'+year,false)
          Map.addLayer(mapbiomas.eq(30).selfMask(),{palette:['cyan']},'mapbiomasRaisg c30 - '+year, false)
          Map.addLayer(mapbiomas.eq(24).selfMask(),{palette:['cyan']},'mapbiomasRaisg c24 - '+year, false)
          Map.addLayer(mapbiomas.eq(24).selfMask(),{palette:['aa0000']},'mapbiomasRaisg c24r - '+year, false)
          // Map.addLayer (shade_year.gte(55).and(shade_year.lte(70)).selfMask(), {palette: ['ffffff',/*'04fff4','0c2aff','001b9d'*/], min: 0, max:1}, 'shade_year',false);
          // Map.addLayer (csf_year.gte(0.35).or(freq_year.gt(3).and(csf_year.gt(0.7))).selfMask(), {palette: 'coral'}, 'csf_year_agua',false);

          // Map.addLayer(csf_year,{palette:['ffffff','aa0000']},'csf_year - '+year, false)
          // Map.addLayer(soil_year,{palette:['ffffff','aa0000']},'soil_year - '+year, false)
          // Map.addLayer(soil_year.gt(20).selfMask(),{palette:['aa0000','aa0000']},'soil_year20 - '+year, false)
          // Map.addLayer(soil_year.gt(18).selfMask(),{palette:['aa0000','aa0000']},'soil_year18 - '+year, false)
          // Map.addLayer(soil_year.gt(15).selfMask(),{palette:['aa0000','aa0000']},'soil_year15 - '+year, false)
          
           Map.addLayer(srtm_mean_img.lt(threshold_srtm_mean).selfMask(), {"palette":"9200ff"}, 'srtm mean img', false)
        }
          // ES: DEPENDENCIA: geometry debe existir como geometría importada o definida; se usa solo para mostrar objetos próximos, con buffer de 5000 m.
          // EN: DEPENDENCY: geometry must exist as an imported or defined geometry; it is used only to display nearby objects within a 5000 m buffer.
          Map.addLayer(tables_merged.filterBounds(geometry.buffer(5000)),{},'poligon',false)
    });
    }
    
    // ES: Recalcular frecuencia después de los filtros principales y mostrar agua con frecuencia ≥6. Este resumen se calcula antes de sustituir water_img por water_img2, por lo que no incorpora la exclusión opcional de cobertura.
    // EN: Recalculate frequency after the main filters and display water with frequency ≥6. This summary is computed before replacing water_img with water_img2, so it does not include optional land-cover exclusion.
    var img_input_freq = water_img.gte(1).and(water_img.lte(3)).selfMask()
                            .reduce(ee.Reducer.sum());
    
    var img_input = img_input_freq
    .gte(6)
    .selfMask();
    
    var colorRamp = ['ffffff','02ffe8','0417ff','000da7'];
    
    if(vis.Map_addLayer){
    Map.addLayer (img_input_freq, {palette: colorRamp, min:0, max:12}, 'freq',false);
    Map.addLayer (img_input, {palette: 'blue'}, 'annual',false)
    Map.addLayer(region_export_vect.style({fillColor: '00000001'}),{},'region_export_vect')
    }
    
  if(useMask_Mapbiomas){
    // ES: Seleccionar la versión con exclusión de cobertura para exportar cuando la opción está activa.
    // EN: Select the land-cover exclusion version for export when the option is enabled.
    var water_img = water_img2;
  }
  
  // ES: Agregar año, versión y país a los metadatos de salida.
  // EN: Add year, version and country to output metadata.
  water_img = water_img.set('year', year)
                       .set('version', version)
                       .set('country', paisName.toUpperCase());
  
  // //print(water_img)
  // water_img = water_img.set('reg_clasif',region_interes)
  // print('capa a exportar',water_img)
   
  // ES: Crear la tarea de exportación mensual multibanda a 30 m con pirámides por moda. Ejecutar desde Tasks. La versión no forma parte del nombre del asset.
  // EN: Create the monthly multiband export task at 30 m with mode pyramids. Run it from Tasks. The version is not part of the asset name.
  Export.image.toAsset({
    image: water_img, 
    description: paisName + '_water_' + year,  
    // assetId: 'projects/mapbiomas-raisg/MAPBIOMAS-WATER/COLECCION2/'+ paisName.toUpperCase() +'/POSTPROCESSING/02-mask-01/Tucumano-Boliviano-'+'water-' + year,
    assetId: 'projects/mapbiomas-'+ paisName.toLowerCase() +'/assets/WATER/COLLECTION-1/00-BETA/POSTPROCESSING/02-mask-02/water-mask-' + year,
    region: region_export_vect.geometry().bounds(), 
    scale: 30,
    pyramidingPolicy: {
        '.default': 'mode'
    },
    maxPixels: 1e13
  });
  
}
//projects/mapbiomas-raisg/MAPBIOMAS-WATER/COLECCION2/BOLIVIA/POSTPROCESSING/02-mask
