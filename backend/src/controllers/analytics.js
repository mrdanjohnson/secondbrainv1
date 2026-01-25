import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { query } from '../db/index.js';
import * as vectorService from '../services/vectorService.js';

export const analyticsController = {
  // Get timeline stats (memories per day/week/month)
  getTimeline: asyncHandler(async (req, res) => {
    const { period = '30days', groupBy = 'day' } = req.query;
    
    let interval, groupFormat;
    switch (groupBy) {
      case 'day':
        groupFormat = 'DATE(created_at)';
        break;
      case 'week':
        groupFormat = 'DATE_TRUNC(\'week\', created_at)';
        break;
      case 'month':
        groupFormat = 'DATE_TRUNC(\'month\', created_at)';
        break;
      default:
        groupFormat = 'DATE(created_at)';
    }
    
    let periodValue;
    switch (period) {
      case '7days':
        periodValue = 7;
        break;
      case '30days':
        periodValue = 30;
        break;
      case '90days':
        periodValue = 90;
        break;
      default:
        periodValue = 30;
    }
    
    const result = await query(
      `SELECT ${groupFormat} as date, COUNT(*) as count
       FROM memories
       WHERE created_at >= NOW() - INTERVAL '${periodValue} days'
       GROUP BY ${groupFormat}
       ORDER BY date ASC`,
      []
    );
    
    res.json({
      success: true,
      data: {
        period,
        groupBy,
        timeline: result.rows
      }
    });
  }),

  // Get category distribution over time
  getCategoryDistribution: asyncHandler(async (req, res) => {
    const { period = '30days' } = req.query;
    
    let periodValue;
    switch (period) {
      case '7days':
        periodValue = 7;
        break;
      case '30days':
        periodValue = 30;
        break;
      case '90days':
        periodValue = 90;
        break;
      default:
        periodValue = 30;
    }
    
    const result = await query(
      `SELECT 
         DATE(created_at) as date,
         category,
         COUNT(*) as count
       FROM memories
       WHERE created_at >= NOW() - INTERVAL '${periodValue} days'
       GROUP BY DATE(created_at), category
       ORDER BY date ASC, category ASC`,
      []
    );
    
    res.json({
      success: true,
      data: {
        period,
        distribution: result.rows
      }
    });
  }),

  // Get busiest days/times
  getBusiestTimes: asyncHandler(async (req, res) => {
    const { period = '30days' } = req.query;
    
    let periodValue = period === '7days' ? 7 : period === '90days' ? 90 : 30;
    
    // Day of week analysis
    const dayOfWeekResult = await query(
      `SELECT 
         EXTRACT(DOW FROM created_at) as day_of_week,
         COUNT(*) as count
       FROM memories
       WHERE created_at >= NOW() - INTERVAL '${periodValue} days'
       GROUP BY EXTRACT(DOW FROM created_at)
       ORDER BY day_of_week ASC`,
      []
    );
    
    // Hour of day analysis
    const hourResult = await query(
      `SELECT 
         EXTRACT(HOUR FROM created_at) as hour,
         COUNT(*) as count
       FROM memories
       WHERE created_at >= NOW() - INTERVAL '${periodValue} days'
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour ASC`,
      []
    );
    
    res.json({
      success: true,
      data: {
        period,
        busiestDays: dayOfWeekResult.rows.map(r => ({
          dayOfWeek: parseInt(r.day_of_week),
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(r.day_of_week)],
          count: parseInt(r.count)
        })),
        busiestHours: hourResult.rows.map(r => ({
          hour: parseInt(r.hour),
          count: parseInt(r.count)
        }))
      }
    });
  }),

  // Get overdue and upcoming statistics
  getDueDateStats: asyncHandler(async (req, res) => {
    const overdue = await vectorService.getOverdue(100);
    const upcoming7 = await vectorService.getUpcoming(7, 100);
    const upcoming30 = await vectorService.getUpcoming(30, 100);
    
    res.json({
      success: true,
      data: {
        overdue: {
          count: overdue.length,
          items: overdue.slice(0, 10) // Return top 10
        },
        upcoming: {
          next7Days: {
            count: upcoming7.length,
            items: upcoming7.slice(0, 10)
          },
          next30Days: {
            count: upcoming30.length,
            items: upcoming30.slice(0, 10)
          }
        }
      }
    });
  }),

  // Get summary statistics
  getSummaryStats: asyncHandler(async (req, res) => {
    const totalResult = await query('SELECT COUNT(*) as total FROM memories', []);
    const categoryStats = await vectorService.getCategoryStats();
    
    const todayResult = await query(
      `SELECT COUNT(*) as today FROM memories WHERE DATE(created_at) = CURRENT_DATE`,
      []
    );
    
    const thisWeekResult = await query(
      `SELECT COUNT(*) as week FROM memories 
       WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)`,
      []
    );
    
    const thisMonthResult = await query(
      `SELECT COUNT(*) as month FROM memories 
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
      []
    );
    
    const overdueCount = await query(
      `SELECT COUNT(*) as overdue FROM memories 
       WHERE due_date IS NOT NULL AND due_date < NOW()`,
      []
    );
    
    res.json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].total),
        today: parseInt(todayResult.rows[0].today),
        thisWeek: parseInt(thisWeekResult.rows[0].week),
        thisMonth: parseInt(thisMonthResult.rows[0].month),
        overdue: parseInt(overdueCount.rows[0].overdue),
        byCategory: categoryStats
      }
    });
  })
};

export default analyticsController;
