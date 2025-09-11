const Post = require('../models/Post');
const User = require('../models/User');

// Créer un nouveau post
exports.createPost = async (req, res) => {
  try {
    const { content, tags } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du post est requis'
      });
    }

    const post = await Post.create({
      content: content.trim(),
      author: req.user.id,
      tags: tags || []
    });

    // Peupler les informations de l'auteur
    await post.populate('author', 'nom email photoProfil role');

    res.status(201).json({
      success: true,
      message: 'Post créé avec succès',
      post
    });
  } catch (error) {
    console.error('Erreur lors de la création du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du post',
      error: error.message
    });
  }
};

// Récupérer tous les posts
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag } = req.query;
    
    const query = { isActive: true };
    if (tag) {
      query.tags = { $in: [tag] };
    }

    const posts = await Post.find(query)
      .populate('author', 'nom email photoProfil role')
      .populate('comments.user', 'nom photoProfil')
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des posts',
      error: error.message
    });
  }
};

// Liker/Unliker un post
exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà liké
    const likeIndex = post.likes.findIndex(like => like.user.toString() === userId);

    if (likeIndex > -1) {
      // Retirer le like
      post.likes.splice(likeIndex, 1);
    } else {
      // Ajouter le like
      post.likes.push({ user: userId });
    }

    await post.save();

    res.json({
      success: true,
      message: likeIndex > -1 ? 'Like retiré' : 'Post liké',
      likesCount: post.likesCount,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Erreur lors du toggle like:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du toggle like',
      error: error.message
    });
  }
};

// Ajouter un commentaire
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du commentaire est requis'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    post.comments.push({
      user: req.user.id,
      content: content.trim()
    });

    await post.save();
    await post.populate('comments.user', 'nom photoProfil');

    res.json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      comment: post.comments[post.comments.length - 1],
      commentsCount: post.commentsCount
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du commentaire',
      error: error.message
    });
  }
};

// Supprimer un post (auteur seulement)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post non trouvé'
      });
    }

    // Vérifier si l'utilisateur est l'auteur ou un admin
    if (post.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce post'
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({
      success: true,
      message: 'Post supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du post',
      error: error.message
    });
  }
};

// Récupérer les statistiques de la communauté
exports.getCommunityStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ estActif: true });
    
    // Posts créés aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = await Post.countDocuments({
      isActive: true,
      dateCreation: { $gte: today }
    });

    // Utilisateurs actifs (connectés dans les 7 derniers jours)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      estActif: true,
      derniereConnexion: { $gte: weekAgo }
    });

    // Tags populaires
    const popularTags = await Post.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalPosts,
        totalUsers,
        postsToday,
        activeUsers,
        popularTags: popularTags.map(tag => ({
          name: tag._id,
          count: tag.count
        }))
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};
