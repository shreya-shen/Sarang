
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabaseService } from '@/services/supabase'

type DataSource = 'mock' | 'supabase' | 'external'

interface AppContextType {
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
  user: any
  isAuthenticated: boolean
  spotifyLinked: boolean
  setSpotifyLinked: (linked: boolean) => void
  loading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataSource, setDataSource] = useState<DataSource>('supabase')
  const [spotifyLinked, setSpotifyLinked] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const currentUser = await supabaseService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.log('No user session found')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const isAuthenticated = !!user

  return (
    <AppContext.Provider value={{
      dataSource,
      setDataSource,
      user,
      isAuthenticated,
      spotifyLinked,
      setSpotifyLinked,
      loading
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
