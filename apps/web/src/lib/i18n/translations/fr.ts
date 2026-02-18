import type { TranslationKeys } from '../types';

export const fr: TranslationKeys = {
  // Navigation
  'nav.home': 'Accueil',
  'nav.rewards': 'Recompenses',
  'nav.leaderboard': 'Classement',
  'nav.settings': 'Parametres',
  'nav.store': 'Boutique',
  'nav.chores': 'Taches',
  'nav.family': 'Famille',
  'nav.activity': 'Activite',
  'nav.menu': 'Ouvrir le menu',
  'nav.close_menu': 'Fermer le menu',

  // Common actions
  'action.save': 'Enregistrer',
  'action.cancel': 'Annuler',
  'action.delete': 'Supprimer',
  'action.edit': 'Modifier',
  'action.create': 'Creer',
  'action.confirm': 'Confirmer',
  'action.back': 'Retour',
  'action.next': 'Suivant',
  'action.done': 'Termine',
  'action.search': 'Rechercher',
  'action.filter': 'Filtrer',
  'action.sort': 'Trier',
  'action.refresh': 'Actualiser',
  'action.sign_in': 'Se connecter',
  'action.sign_up': "S'inscrire",
  'action.sign_out': 'Se deconnecter',

  // Chores
  'chores.title': 'Taches',
  'chores.add_chore': 'Ajouter une tache',
  'chores.complete': 'Terminer',
  'chores.skip': 'Passer',
  'chores.assign_to': 'Assigner a',
  'chores.due_date': 'Date limite',
  'chores.points': 'Points',
  'chores.recurring': 'Recurrente',
  'chores.no_chores': 'Aucune tache pour le moment',
  'chores.overdue': 'En retard',
  'chores.today': "Aujourd'hui",
  'chores.upcoming': 'A venir',

  // Rewards
  'rewards.title': 'Recompenses',
  'rewards.redeem': 'Echanger',
  'rewards.cost': 'Cout',
  'rewards.available': 'Disponible',
  'rewards.redeemed': 'Echange',
  'rewards.create_reward': 'Creer une recompense',

  // Gamification
  'gamification.points': 'Points',
  'gamification.streak': 'Serie',
  'gamification.streak_days': 'Serie de {{count}} jours',
  'gamification.badge_earned': 'Badge obtenu !',
  'gamification.level_up': 'Niveau superieur !',
  'gamification.leaderboard': 'Classement',
  'gamification.rank': 'Rang',

  // Family
  'family.title': 'Famille',
  'family.members': 'Membres',
  'family.invite': 'Inviter un membre',
  'family.role_parent': 'Parent',
  'family.role_child': 'Enfant',
  'family.role_teen': 'Adolescent',

  // Settings
  'settings.title': 'Parametres',
  'settings.profile': 'Profil',
  'settings.notifications': 'Notifications',
  'settings.security': 'Securite',
  'settings.accessibility': 'Accessibilite',
  'settings.language': 'Langue',
  'settings.theme': 'Theme',

  // Accessibility
  'a11y.high_contrast': 'Contraste eleve',
  'a11y.reduced_motion': 'Mouvement reduit',
  'a11y.reading_font': 'Police de lecture',
  'a11y.font_size': 'Taille de police',
  'a11y.focus_mode': 'Mode concentration',

  // Time
  'time.today': "Aujourd'hui",
  'time.yesterday': 'Hier',
  'time.tomorrow': 'Demain',
  'time.days_ago': 'Il y a {{count}} jours',
  'time.just_now': "A l'instant",

  // Errors
  'error.generic': 'Une erreur est survenue. Veuillez reessayer.',
  'error.network': 'Erreur reseau. Verifiez votre connexion.',
  'error.not_found': 'Introuvable.',
  'error.unauthorized': 'Veuillez vous connecter pour continuer.',

  // Empty states
  'empty.no_results': 'Aucun resultat trouve.',
  'empty.no_data': 'Aucune donnee disponible.',
};
