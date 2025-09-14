const Post = require('../models/Post');
const User = require('../models/User');
const Discussion = require('../models/Discussion');
const Group = require('../models/Group');

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

// ==========================
// Publications de groupe
// ==========================

// Créer un post dans un groupe (membres uniquement)
exports.createGroupPost = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, tags } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Contenu requis' });
    }
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    const uid = req.user.id.toString();
    if (!group.members.find(m => m.toString() === uid)) {
      return res.status(403).json({ success: false, message: 'Accès réservé aux membres du groupe' });
    }

    // Seul le propriétaire (formateur) peut publier dans le groupe
    if (group.owner.toString() !== uid) {
      return res.status(403).json({ success: false, message: 'Seul le formateur (propriétaire) peut publier dans le groupe.' });
    }

    const post = await Post.create({ content: content.trim(), author: uid, tags: tags || [], group: groupId });
    await post.populate('author', 'nom photoProfil');
    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error('Erreur création post de groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Lister les posts d'un groupe (membres uniquement)
exports.getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    const uid = req.user?.id?.toString();
    // Permettre lecture aux membres uniquement (et au propriétaire)
    if (!uid || !group.members.find(m => m.toString() === uid)) {
      return res.status(403).json({ success: false, message: 'Accès réservé aux membres du groupe' });
    }

    const query = { isActive: true, group: groupId };
    const posts = await Post.find(query)
      .populate('author', 'nom photoProfil')
      .populate('comments.user', 'nom photoProfil')
      .sort({ dateCreation: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Post.countDocuments(query);
    res.json({ success: true, posts, pagination: { currentPage: Number(page), totalPages: Math.ceil(total / Number(limit)), total } });
  } catch (error) {
    console.error('Erreur récupération posts de groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Ajouter un commentaire à un post de groupe (membres uniquement)
exports.addGroupPostComment = async (req, res) => {
  try {
    const { groupId, postId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: 'Contenu requis' });
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    const uid = req.user.id.toString();
    if (!group.members.find(m => m.toString() === uid)) {
      return res.status(403).json({ success: false, message: 'Accès réservé aux membres du groupe' });
    }

    const post = await Post.findOne({ _id: postId, group: groupId, isActive: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post non trouvé' });
    post.comments.push({ user: uid, content: content.trim() });
    await post.save();
    await post.populate('comments.user', 'nom photoProfil');
    const newComment = post.comments[post.comments.length - 1];
    res.json({ success: true, comment: newComment, commentsCount: post.comments.length });
  } catch (error) {
    console.error('Erreur commentaire post de groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};
// Ajouter un membre (par email) - réservé au propriétaire
exports.addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'Email requis' });

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    if (group.owner.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Seul le propriétaire du groupe peut inviter des membres' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    const uid = user._id.toString();
    if (!group.members.find(m => m.toString() === uid)) {
      group.members.push(uid);
      await group.save();
    }

    res.json({ success: true, memberCount: group.members.length });
  } catch (error) {
    console.error('Erreur ajout membre groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Retirer un membre - réservé au propriétaire
exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId requis' });

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    if (group.owner.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Seul le propriétaire du groupe peut retirer des membres' });

    group.members = group.members.filter(m => m.toString() !== userId.toString());
    await group.save();
    res.json({ success: true, memberCount: group.members.length });
  } catch (error) {
    console.error('Erreur retrait membre groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// ==========================
// Groupes d'étude
// ==========================

// Créer un groupe
exports.createGroup = async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nom du groupe requis' });
    }

    // Seuls les formateurs (ou admins) peuvent créer des groupes
    if (!req.user || !['formateur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Seuls les formateurs peuvent créer des groupes.' });
    }

    const group = await Group.create({
      name: name.trim(),
      description: (description || '').trim(),
      owner: req.user.id,
      members: [req.user.id],
      tags: tags || []
    });

    await group.populate('owner', 'nom photoProfil');

    res.status(201).json({ success: true, group });
  } catch (error) {
    console.error('Erreur création groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Lister les groupes (visibilité restreinte aux membres et au propriétaire)
exports.getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, tag } = req.query;
    const uid = req.user?.id?.toString();
    if (!uid) return res.status(401).json({ success: false, message: 'Authentification requise' });

    // Un groupe n'est visible que si l'utilisateur est propriétaire (owner) ou membre
    const query = {
      isActive: true,
      $or: [
        { owner: uid },
        { members: uid }
      ]
    };

    if (search) query.name = { $regex: search, $options: 'i' };
    if (tag) query.tags = { $in: [tag] };

    const groups = await Group.find(query)
      .populate('owner', 'nom photoProfil')
      .populate('members', 'nom photoProfil')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Group.countDocuments(query);

    res.json({ success: true, groups, pagination: { currentPage: Number(page), totalPages: Math.ceil(total / Number(limit)), total } });
  } catch (error) {
    console.error('Erreur récupération groupes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Rejoindre un groupe
exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
    // Désormais l'adhésion est sur invitation uniquement
    return res.status(403).json({ success: false, message: "L'adhésion est réservée à l'invitation du propriétaire du groupe." });
  } catch (error) {
    console.error('Erreur rejoindre groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Quitter un groupe
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) return res.status(404).json({ success: false, message: 'Groupe non trouvé' });

    const uid = req.user.id.toString();
    group.members = group.members.filter(m => m.toString() !== uid);
    await group.save();

    res.json({ success: true, memberCount: group.members.length });
  } catch (error) {
    console.error('Erreur quitter groupe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// ==========================
// Discussions (Forum)
// ==========================

// Créer une discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
    }

    // Restriction: seuls les formateurs (ou admins) peuvent créer des discussions
    if (!req.user || !['formateur', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Seuls les formateurs peuvent créer des discussions.' });
    }

    const discussion = await Discussion.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user.id,
      tags: tags || []
    });

    await discussion.populate('author', 'nom email photoProfil role');

    res.status(201).json({ success: true, discussion });
  } catch (error) {
    console.error('Erreur lors de la création de la discussion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les discussions (avec pagination)
exports.getDiscussions = async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    const query = { isActive: true };
    if (tag) query.tags = { $in: [tag] };
    if (search) query.$text = { $search: search };

    const discussions = await Discussion.find(query)
      .populate('author', 'nom photoProfil role')
      .populate('replies.user', 'nom photoProfil')
      .sort({ lastActivity: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Discussion.countDocuments(query);

    res.json({
      success: true,
      discussions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des discussions:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
};

// Ajouter une réponse
exports.addDiscussionReply = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Contenu de la réponse requis' });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion || !discussion.isActive) {
      return res.status(404).json({ success: false, message: 'Discussion non trouvée' });
    }

    discussion.replies.push({ user: req.user.id, content: content.trim() });
    discussion.lastActivity = new Date();
    await discussion.save();
    await discussion.populate('replies.user', 'nom photoProfil');

    const newReply = discussion.replies[discussion.replies.length - 1];

    res.json({ success: true, reply: newReply, repliesCount: discussion.replies.length });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réponse:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
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
