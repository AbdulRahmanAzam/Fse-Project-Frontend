import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/home-page'
import MainLayout from './components/layout/main-layout'
import AuthPage from './pages/auth-page'
import ProtectedRoute from './components/routes/protected-route'
import PublicRoute from './components/routes/public-route'
import CommunitiesPage from './pages/all-communities-page'
import CommunityPage from './pages/community-page'
import CreateCommunityPage from './pages/create-community-page'
import CreatePostPage from './pages/create-post-page'
import EditPostPage from './pages/edit-post-page'
import PostPage from './pages/post-page'
import NotFoundPage from './pages/not-found-page';
import PendingPostsPage from './pages/pending-posts-page';
import ProfilePage from './pages/profile-page'
import FriendsPage from './pages/friends-page'
import VerificationPage from './pages/verification-page'
import RedirectPage from './pages/redirect-page'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/verify" element={<PublicRoute><VerificationPage /></PublicRoute>} />
      <Route path="/redirect" element={<PublicRoute><RedirectPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute permission="member"><MainLayout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/community/create" element={<ProtectedRoute permission="admin"><CreateCommunityPage /></ProtectedRoute>} />
        <Route path="/community/:id" element={<CommunityPage />} />
        <Route path="/community/:id/create-post" element={<CreatePostPage />} />
        <Route path="/community/:id/edit-post/:postId" element={<EditPostPage />} />
        <Route path="/community/:id/post/:postId" element={<PostPage />} />
        <Route path="/pending-posts" element={<ProtectedRoute permission="admin"><PendingPostsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/friends" element={<FriendsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes;
