import { Card } from '@/components/ui/card';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

type DashboardProps = {
  user: User | null;
};

type AdminStats = {
  users: {
    total: number;
    withFaceAuth: number;
    withoutFaceAuth: number;
    percentWithFaceAuth: number;
  };
  faceSamples: {
    total: number;
    averagePerUser: number;
  };
  timestamp: string;
};

const Dashboard = ({ user }: DashboardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // Making the API request with proper parameters
        const response = await apiRequest('/api/admin/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Verify the response shape matches our expected type
        if (response && 
            typeof response === 'object' && 
            'users' in response && 
            'faceSamples' in response && 
            'timestamp' in response) {
          setAdminStats(response as AdminStats);
          setStatsError(null);
        } else {
          console.error('Invalid admin stats response format');
          setStatsError('Invalid data format received from server');
        }
      } catch (err) {
        console.error('Failed to fetch admin statistics:', err);
        setStatsError('Failed to load admin statistics');
      }
    };
    
    if (user) {
      fetchAdminStats();
    }
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Refresh stats every 30 seconds if user is logged in
    let interval: NodeJS.Timeout | null = null;
    if (user) {
      interval = setInterval(fetchAdminStats, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);
  
  useEffect(() => {
    if (!user && !isLoading) {
      toast({
        title: "Authentication required",
        description: "Please login to access the dashboard",
        variant: "destructive",
      });
    }
  }, [user, isLoading, toast]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <Card className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Dashboard</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">View your authentication information</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-10">
              <div className="mb-4">
                <i className="fas fa-lock text-gray-400 text-4xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
              <p className="text-gray-500 mb-6">You need to be logged in to view the dashboard</p>
              <Link href="/">
                <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Go to Login
                </a>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 sm:px-0">
      <Card className="bg-white shadow sm:rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Dashboard</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Welcome, {user.username}</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-base font-medium text-gray-700 mb-2">Profile Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">User ID</span>
                  <span className="text-sm font-mono bg-gray-100 rounded px-2 py-0.5">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Facial Data</span>
                  <span className="text-sm font-medium text-green-600">Enrolled</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-base font-medium text-gray-700 mb-2">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <i className="fas fa-sign-in-alt text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Successful login</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <i className="fas fa-fingerprint text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Face verification</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-base font-medium text-gray-700 mb-2">Security</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Encryption</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i className="fas fa-lock text-xs mr-1"></i>
                    Enabled
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">2FA Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i className="fas fa-check text-xs mr-1"></i>
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Last Updated</span>
                  <span className="text-sm text-gray-700">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Admin Statistics Section */}
      {adminStats && (
        <Card className="bg-white shadow sm:rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-600 to-blue-500 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              System Statistics
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-indigo-100">
              Live metrics from the facial authentication system
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-base font-semibold text-gray-700 mb-4">User Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-indigo-700">{adminStats.users.total}</div>
                    <div className="text-sm text-indigo-600">Total Users</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-green-700">{adminStats.users.withFaceAuth}</div>
                    <div className="text-sm text-green-600">Using Face Auth</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Face Auth Adoption</span>
                    <span className="text-sm font-medium">{adminStats.users.percentWithFaceAuth.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${adminStats.users.percentWithFaceAuth}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-base font-semibold text-gray-700 mb-4">Face Samples</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-blue-700">{adminStats.faceSamples.total}</div>
                    <div className="text-sm text-blue-600">Total Samples</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-lg font-bold text-purple-700">{adminStats.faceSamples.averagePerUser.toFixed(1)}</div>
                    <div className="text-sm text-purple-600">Avg Per User</div>
                  </div>
                </div>
                
                <div className="mt-4 text-right text-xs text-gray-500">
                  Last updated: {new Date(adminStats.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {statsError && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{statsError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Face Recognition Stats</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Recognition Accuracy</span>
                  <span className="text-sm font-medium">95%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">False Positive Rate</span>
                  <span className="text-sm font-medium">2.4%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '2.4%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">False Negative Rate</span>
                  <span className="text-sm font-medium">1.8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '1.8%' }}></div>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Detections</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-check-circle text-green-500 mr-2"></i>
                    <span>Successful verification at {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Facial Recognition Tools</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link href="/similarity-test">
                <a className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-exchange-alt text-primary-600"></i>
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-1">Similarity Test</h4>
                      <p className="text-sm text-gray-500">Compare two faces to determine similarity</p>
                    </div>
                    <div className="ml-auto">
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </div>
                  </div>
                </a>
              </Link>
              
              <Link href="/matching-test">
                <a className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-search text-primary-600"></i>
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-1">Matching Test</h4>
                      <p className="text-sm text-gray-500">Match a face against a dataset</p>
                    </div>
                    <div className="ml-auto">
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </div>
                  </div>
                </a>
              </Link>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-60">
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                    <i className="fas fa-cog text-gray-500"></i>
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-1">Settings</h4>
                    <p className="text-sm text-gray-500">Configure facial recognition parameters</p>
                  </div>
                  <div className="ml-auto">
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
