const reportRepository = require('../repositories/report.repository');
const notificationRepository = require('../repositories/notification.repository');
const activityLogRepository = require('../repositories/activityLog.repository');
const { createReportEntity } = require('../models/report.model');
const { createNotificationEntity } = require('../models/notification.model');
const { createActivityLogEntity } = require('../models/activityLog.model');
const { generateReportId, generateNotificationId, generateActivityId } = require('../helpers/idHelper');
const { nowISO } = require('../helpers/dateHelper');
const { NotFoundError, ForbiddenError } = require('../errors/AppError');
const { REPORT_STATUS } = require('../constants/reportStatus');
const { CATEGORY_DEFAULT_PRIORITY, REPORT_PRIORITY } = require('../constants/reportCategories');
const { ROLES } = require('../constants/roles');
const { parsePagination, paginateArray } = require('../utils/pagination');
const { filterByRadius } = require('../utils/geo');
const snsService = require('../aws/sns.service');
const notificationService = require('./notification.service');

class ReportService {
  async createReport(userId, data) {
    const reportId = generateReportId();
    const timestamp = nowISO();
    const priority = data.priority || CATEGORY_DEFAULT_PRIORITY[data.category] || REPORT_PRIORITY.MEDIUM;

    const report = createReportEntity({
      reportId,
      userId,
      title: data.title,
      category: data.category,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      location: data.location,
      imageUrl: data.imageUrl || null,
      imageKeys: data.imageKeys || [],
      status: REPORT_STATUS.PENDING,
      priority,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    await reportRepository.create(report);
    await this._logActivity('report', reportId, 'REPORT_CREATED', userId, { category: report.category });

    await notificationService.notifyReportCreated(report);
    await snsService.publishEmergencyAlert({
      reportId,
      category: report.category,
      priority: report.priority,
      latitude: report.latitude,
      longitude: report.longitude,
    });

    return report;
  }

  async listReports(query, currentUser) {
    const filters = {
      status: query.status,
      category: query.category,
      priority: query.priority,
      search: query.search,
    };

    if (currentUser.role === ROLES.CITIZEN) {
      filters.userId = currentUser.userId;
    } else if (query.userId) {
      filters.userId = query.userId;
    }

    const pagination = parsePagination(query);
    const items = await reportRepository.findWithFilters(filters);
    return paginateArray(items, pagination);
  }

  async getReportById(reportId, currentUser) {
    const report = await reportRepository.findById(reportId);
    if (!report) throw new NotFoundError('Report not found');

    if (currentUser.role === ROLES.CITIZEN && report.userId !== currentUser.userId) {
      throw new ForbiddenError('You do not have access to this report');
    }

    return report;
  }

  async updateStatus(reportId, status, currentUser, notes) {
    const report = await this.getReportById(reportId, currentUser);
    const updates = {
      status,
      updatedAt: nowISO(),
    };

    if (status === REPORT_STATUS.RESOLVED) {
      updates.resolvedAt = nowISO();
    }

    if (notes) updates.adminNotes = notes;

    const updated = await reportRepository.update(reportId, updates);
    await this._logActivity('report', reportId, 'STATUS_UPDATED', currentUser.userId, { status });

    await notificationService.notifyStatusChange(updated, report.status);
    return updated;
  }

  async resolveReport(reportId, currentUser) {
    return this.updateStatus(reportId, REPORT_STATUS.RESOLVED, currentUser);
  }

  async getNearbyReports({ latitude, longitude, radiusKm = 5, query = {} }) {
    const filters = { status: query.status, category: query.category };
    let items = await reportRepository.findWithFilters(filters);
    items = filterByRadius(items, latitude, longitude, radiusKm);
    const pagination = parsePagination(query);
    return paginateArray(items, pagination);
  }

  async getAnalytics() {
    const all = await reportRepository.findAll();
    const byStatus = {};
    const byCategory = {};
    const byPriority = {};

    all.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
    });

    const today = new Date().toISOString().split('T')[0];
    const resolvedToday = all.filter(
      (r) => r.resolvedAt && r.resolvedAt.startsWith(today),
    ).length;

    return {
      total: all.length,
      active: all.filter((r) => r.status !== REPORT_STATUS.RESOLVED && r.status !== REPORT_STATUS.CANCELLED).length,
      resolvedToday,
      byStatus,
      byCategory,
      byPriority,
      criticalCount: all.filter((r) => r.priority === REPORT_PRIORITY.CRITICAL && r.status !== REPORT_STATUS.RESOLVED).length,
    };
  }

  async _logActivity(entityType, entityId, action, performedBy, metadata = {}) {
    await activityLogRepository.create(
      createActivityLogEntity({
        activityId: generateActivityId(),
        entityType,
        entityId,
        action,
        performedBy,
        metadata,
        createdAt: nowISO(),
      }),
    );
  }
}

module.exports = new ReportService();
