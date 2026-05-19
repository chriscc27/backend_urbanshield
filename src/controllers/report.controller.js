const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user.userId, req.body);
  sendSuccess(res, { message: 'Report created', data: report, statusCode: 201 });
});

const listReports = asyncHandler(async (req, res) => {
  const result = await reportService.listReports(req.query, req.user);
  sendSuccess(res, { message: 'Reports retrieved', data: result });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await reportService.getReportById(req.params.id, req.user);
  sendSuccess(res, { message: 'Report retrieved', data: report });
});

const updateStatus = asyncHandler(async (req, res) => {
  const report = await reportService.updateStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.notes,
  );
  sendSuccess(res, { message: 'Report status updated', data: report });
});

const resolveReport = asyncHandler(async (req, res) => {
  const report = await reportService.resolveReport(req.params.id, req.user);
  sendSuccess(res, { message: 'Report resolved', data: report });
});

const getNearby = asyncHandler(async (req, res) => {
  const result = await reportService.getNearbyReports({
    latitude: req.query.latitude,
    longitude: req.query.longitude,
    radiusKm: req.query.radiusKm,
    query: req.query,
  });
  sendSuccess(res, { message: 'Nearby reports retrieved', data: result });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await reportService.getAnalytics();
  sendSuccess(res, { message: 'Report analytics retrieved', data: analytics });
});

module.exports = {
  createReport,
  listReports,
  getReport,
  updateStatus,
  resolveReport,
  getNearby,
  getAnalytics,
};
