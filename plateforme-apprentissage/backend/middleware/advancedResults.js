const advancedResults = (model, populate) => async (req, res, next) => {
  // Copie de la requête
  const reqQuery = { ...req.query };

  // Champs à exclure pour le filtrage
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Création de la chaîne de requête
  let queryStr = JSON.stringify(reqQuery);
  
  // Création des opérateurs ($gt, $gte, $lt, $lte, $in)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Construction de la requête de base
  let query = model.find(JSON.parse(queryStr));

  // Recherche par texte
  if (req.query.search) {
    const searchFields = ['titre', 'description', 'tags', 'categorie'];
    const searchQuery = searchFields.map(field => ({
      [field]: { $regex: req.query.search, $options: 'i' }
    }));
    
    query = query.or([...searchQuery]);
  }

  // Sélection des champs
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Tri
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-dateCreation');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Peuplement des relations
  if (populate) {
    query = query.populate(populate);
  }

  // Exécution de la requête
  const results = await query;

  // Résultat de la pagination
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};

module.exports = advancedResults;
