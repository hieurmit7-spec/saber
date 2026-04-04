import { Navigate } from 'react-router-dom';

// Legacy index route — now redirects to the new React Router entry point
export default function Index() {
  return <Navigate to="/" replace />;
}
