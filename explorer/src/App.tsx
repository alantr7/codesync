import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomeView from './views/HomeView'
import ProjectView from './views/ProjectView'
import SearchView from './views/SearchView';
import { AuthContextProvider } from './contexts/AuthContext';

export const HOST = import.meta.env.VITE_CODESYNC_HOST;

function App() {
  return (
    <>
        <AuthContextProvider>
        <BrowserRouter>
            <Routes>
              <Route path='' element={<HomeView />}></Route>
              <Route path='/search' element={<SearchView />} ></Route>
              <Route path='/project/:ownerId/:projectId' element={<ProjectView />} ></Route>
            </Routes>
        </BrowserRouter>
        </AuthContextProvider>
    </>
  )
}

export default App
