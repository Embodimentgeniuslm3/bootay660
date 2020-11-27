import VuexPersistence from 'vuex-persist';

const OBSERVED_MUTATIONS = [
  'login',
  'logout',
  'setUser',
  'repository/comments/markSeenComments',
  'repository/comments/fetch'
];

export default new VuexPersistence({
  key: 'TAILOR_APP_STATE',
  reducer: state => ({
    auth: state.auth,
    repository: {
      comments: {
        seenByActivity: state.repository.comments.seen.activity,
        seen: {
          ...state.repository.comments.seen,
          activity: state.repository.comments.seenByActivity
        }
      }
    }
  }),
  storage: window.localStorage,
  filter: mutation => OBSERVED_MUTATIONS.includes(mutation.type)
}).plugin;
