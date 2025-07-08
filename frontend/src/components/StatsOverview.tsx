import React from 'react';
import { TrendingUp, Users, Mail, Target, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useProspectStore } from '@/store/prospectStore';

const StatsOverview: React.FC = () => {
  const { prospects } = useProspectStore();

  const stats = [
    {
      title: 'Total Prospects',
      value: prospects.length.toString(),
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ready for Outreach',
      value: prospects.filter(p => p.status === 'ready').length.toString(),
      change: '+8%',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'In Progress',
      value: prospects.filter(p => p.status === 'processing').length.toString(),
      change: '+5%',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Contacted',
      value: prospects.filter(p => p.status === 'contacted').length.toString(),
      change: '+15%',
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const activityStats = [
    {
      title: 'Emails Sent Today',
      value: '24',
      icon: Mail,
      color: 'text-blue-600'
    },
    {
      title: 'Responses Received',
      value: '7',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Active Campaigns',
      value: '3',
      icon: Target,
      color: 'text-purple-600'
    },
    {
      title: 'Data Quality Score',
      value: '87%',
      icon: Activity,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last week</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activityStats.map((stat, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;