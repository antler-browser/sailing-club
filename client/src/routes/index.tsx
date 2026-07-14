import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from '../app'
import { Home } from './home'
import { Category } from './category'
import { EquipmentDetail } from './equipment'
import { Profile } from './profile'
import { NotFound } from './not-found'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'category/:categoryId', element: <Category /> },
      { path: 'equipment/:equipmentId', element: <EquipmentDetail /> },
      { path: 'equipment', element: <Navigate to="/" replace /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
