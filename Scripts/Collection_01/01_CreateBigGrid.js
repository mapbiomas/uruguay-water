/ ES: Cargar las regiones con buffer utilizadas como referencia para los mosaicos LULC.
// EN: Load buffered regions used as a reference for LULC mosaics.
var limiteUR = ee.FeatureCollection("projects/MapBiomas_Pampa/ANCILLARY_DATA/RegionesUy_Buf")
Map.addLayer(limiteUR)

// ES: Cargar la grilla mundial de cartas que se utilizará para formar las grillas mayores.
// EN: Load the global tile grid used to build larger grids.
var grids = ee.FeatureCollection('projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/grid-world')

// ES: Fuente alternativa de límites nacionales, desactivada.
// EN: Alternative national boundary source, disabled.
//var pais = ee.FeatureCollection('projects/mapbiomas-raisg/DATOS_AUXILIARES/VECTORES/paises-4')

// ES: Esta referencia corresponde a Paraguay y se imprime únicamente para consulta.
//     La selección de grillas utiliza la variable region de Uruguay, no esta variable pais.
// EN: This reference points to Paraguay and is printed for inspection only.
//     Grid selection uses the Uruguay region variable, not this pais variable.
var pais = ee.FeatureCollection('projects/mapbiomas-territories/assets/TERRITORIES/LULC/PARAGUAY/COLLECTION3/WORKSPACE/POLITICAL_LEVEL_1')
print(pais)

// ES: Nombre del país que se guardará como atributo de las grillas exportadas.
// EN: Country name stored as an attribute of the exported grids.
var pais_name = 'Uruguay'

// ES: Parámetros para construir la ruta del límite territorial.
//     Coleccion identifica la colección del asset LULC de territorios;
//     no corresponde al número de colección de MapBiomas Agua.
// EN: Parameters used to build the territorial boundary asset path.
//     Coleccion identifies the collection of the LULC territory asset;
//     it is not the MapBiomas Water collection number.
var Pais = 'Uruguay'
var Coleccion = 2;
var Territorio = 'POLITICAL_LEVEL_1'

// ES: Cargar el límite de Uruguay a partir de los parámetros anteriores.
// EN: Load the Uruguay boundary using the parameters above.
var region = ee.FeatureCollection('projects/mapbiomas-territories/assets/TERRITORIES/LULC/'+Pais.toUpperCase()+'/COLLECTION'+Coleccion+'/WORKSPACE/'+Territorio)
              // ES: Opción desactivada para convertir el límite en geometría y aplicar un buffer de 60 m.
              // EN: Disabled option to convert the boundary to a geometry and apply a 60 m buffer.
              //.geometry().buffer(60)

// ES: Pintar el territorio con valor 1 en una imagen; esta imagen no se utiliza posteriormente.
// EN: Paint the territory with value 1 in an image; this image is not used later.
var regionRas = ee.Image().paint(region,1)
Map.addLayer(region,{},'Limite-país');

// ES: Definir el ámbito de selección con el límite de Uruguay.
//     Se conserva desactivada la alternativa de seleccionar un país por su atributo name.
// EN: Set the selection area to the Uruguay boundary.
//     The alternative of selecting a country by its name attribute remains disabled.
var p = region//pais//.filter(ee.Filter.eq('name',pais_name))
Map.addLayer(p,{},'pais')

// ES: Seleccionar las cartas que intersectan el ámbito, conservando sus geometrías completas.
//     Esta operación no recorta las cartas al límite nacional.
// EN: Select tiles intersecting the area, retaining their complete geometries.
//     This operation does not clip tiles to the national boundary.
var grid = grids.filterBounds(p)

// ES: Mostrar los nombres y la distribución espacial de las cartas seleccionadas.
// EN: Display the names and spatial distribution of the selected tiles.
print('grid',grid.aggregate_array('name'))
Map.addLayer(grid,{},'grids')

// ES: Crear el identificador de agrupación bigName con los primeros siete caracteres de name.
//     Se presupone que name existe y que ese prefijo identifica la grilla mayor deseada.
// EN: Create the bigName grouping identifier from the first seven characters of name.
//     This assumes name exists and that its prefix identifies the intended larger grid.
var bigNameProp = grid.map(function(f){
   return f.set('bigName',ee.String(f.get('name')).slice(0,7))
})
print('bigNameProp',bigNameProp)

// ES: Obtener los identificadores únicos para procesar cada grupo una sola vez.
// EN: Retrieve unique identifiers to process each group only once.
var bigName = bigNameProp.aggregate_array('bigName').distinct()
print(bigNameProp.aggregate_array('bigName'))
print('bigName',bigName)

// ES: Consulta opcional del primer grupo, desactivada.
// EN: Optional inspection of the first group, disabled.
//print(bigNameProp.filter(ee.Filter.eq('bigName', ee.String(bigName.get(0)))))

// ES: Construir una entidad por grupo de cartas con el mismo prefijo.
// EN: Build one feature per group of tiles sharing the same prefix.
var bigGrid = bigName.map(function(l){
  // ES: Seleccionar las cartas que pertenecen al grupo actual.
  // EN: Select the tiles belonging to the current group.
  var nuwGrid = bigNameProp.filter(ee.Filter.eq('bigName', ee.String(l)))

  // ES: Construir un MultiPolygon con las coordenadas del grupo y disolver sus componentes.
  //     El valor 50 es el margen máximo de error geométrico, en metros, no un buffer.
  //     La construcción presupone una estructura de coordenadas compatible con MultiPolygon.
  // EN: Build a MultiPolygon from the group coordinates and dissolve its components.
  //     The value 50 is the maximum geometric error margin in meters, not a buffer.
  //     This construction assumes a coordinate structure compatible with MultiPolygon.
  return ee.Feature(ee.Geometry.MultiPolygon(nuwGrid.geometry().coordinates()).dissolve(50))
                // ES: Asignar el país y el identificador de la grilla mayor.
                // EN: Assign the country and the larger grid identifier.
                .set('pais',pais_name).set('grid_name',ee.String(l))
})

// ES: Inspeccionar la lista de entidades y visualizar las grillas resultantes.
// EN: Inspect the feature list and display the resulting grids.
print('bigGrid',bigGrid)
Map.addLayer(ee.FeatureCollection(bigGrid),{},'grid')

// ES: Convertir la lista en una colección vectorial para exportarla.
// EN: Convert the list into a feature collection for export.
bigGrid = ee.FeatureCollection(bigGrid)

// ES: Crear la tarea de exportación de las grillas mayores al asset de destino.
//     Ejecutar la tarea desde la pestaña Tasks del editor de Earth Engine.
// EN: Create the export task for the larger grids to the destination asset.
//     Run the task from the Tasks tab in the Earth Engine Code Editor.
Export.table.toAsset({
    collection: bigGrid,
    description: 'grids_Uruguay',
    assetId: 'projects/mapbiomas-uruguay/assets/WATER/AUXILIARY_DATA/VECTOR/biggrids-uruguay',
})
