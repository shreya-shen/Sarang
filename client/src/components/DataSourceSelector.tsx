
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApp } from '@/contexts/AppContext'
import { Database, Cloud, Globe } from 'lucide-react'

export const DataSourceSelector = () => {
  const { dataSource, setDataSource } = useApp()

  const dataSources = [
    {
      id: 'mock' as const,
      name: 'Mock Data',
      description: 'Use sample data for testing and development',
      icon: Database,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    },
    {
      id: 'supabase' as const,
      name: 'Supabase',
      description: 'Full-stack with Supabase backend',
      icon: Cloud,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    },
    {
      id: 'external' as const,
      name: 'External API',
      description: 'Connect to your custom backend',
      icon: Globe,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
    }
  ]

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-sarang-lavender/30 dark:border-gray-600 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="px-0 sm:px-6">
        <CardTitle className="text-gray-900 dark:text-white transition-colors duration-300">Data Source Configuration</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
          Choose how Sarang should handle data and authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => {
            const Icon = source.icon
            const isActive = dataSource === source.id
            
            return (
              <div key={source.id} className="relative">
                <Button
                  variant={isActive ? "default" : "outline"}
                  className="w-full h-auto p-4 flex flex-col space-y-2"
                  onClick={() => setDataSource(source.id)}
                >
                  <Icon className="h-8 w-8" />
                  <span className="font-semibold">{source.name}</span>
                  <span className="text-xs text-center opacity-75">
                    {source.description}
                  </span>
                </Button>
                {isActive && (
                  <Badge className={`absolute -top-2 -right-2 ${source.color}`}>
                    Active
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Current Configuration:</h4>
          <p className="text-sm text-gray-600">
            <strong>Data Source:</strong> {dataSources.find(s => s.id === dataSource)?.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {dataSource === 'mock' && 'Using sample data for demonstration'}
            {dataSource === 'supabase' && 'Connected to Supabase for full backend functionality'}
            {dataSource === 'external' && 'Configured to use external API endpoints'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
