import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    workspace: null,
    workspaces: [],
    loading: true,
  },
  reducers: {
    setAuth: (state, action) => {
      const user = action.payload.user || null;
      const workspace = 'workspace' in action.payload ? action.payload.workspace : (user?.workspaceId || null);
      const workspaces = action.payload.workspaces || [];
      state.user = user;
      state.workspace = workspace;
      state.workspaces = workspaces;
      state.loading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.workspace = null;
      state.workspaces = [];
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setLoading } = authSlice.actions;
export default authSlice.reducer;
