import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cancelAgentProgress,
  completeAgentProgress,
  createAgentProgress,
  failAgentProgress,
  reduceProgressEvent,
  updateProgressClock,
} from '../src/utils/agentProgress.ts';
import type { AgentProgressState, ProgressUpdate } from '../src/types/agent.ts';

const event = (
  stage: string,
  status: ProgressUpdate['status'],
  elapsed_ms = 0,
): ProgressUpdate => ({ stage, status, elapsed_ms });

const apply = (state: AgentProgressState, ...events: ProgressUpdate[]) => events.reduce(
  (current, item, index) => reduceProgressEvent(current, item, 1_000 + index),
  state,
);

test('groups technical events and updates one stable row per user-facing phase', () => {
  const result = apply(
    createAgentProgress(1_000),
    event('request', 'active'),
    event('normalize', 'completed'),
    event('intent', 'active'),
    event('intent', 'completed'),
  );

  assert.equal(result.steps.length, 1);
  assert.deepEqual(result.steps[0], {
    id: 'understand',
    status: 'completed',
    message: 'Đã hiểu yêu cầu',
    activatedAt: 1_000,
  });
});

test('keeps at most four phases and only one active step', () => {
  const result = apply(
    createAgentProgress(1_000),
    event('request', 'active'),
    event('intent', 'completed'),
    event('entities', 'active'),
    event('conversation', 'completed'),
    event('tools', 'active'),
    event('tools', 'completed'),
    event('compose', 'active'),
    event('compose', 'completed'),
  );

  assert.deepEqual(result.steps.map(step => step.id), ['understand', 'plan', 'retrieve', 'synthesize']);
  assert.equal(result.steps.filter(step => step.status === 'active').length, 1);
  assert.equal(result.steps.at(-1)?.message, 'Đang chuẩn bị câu trả lời...');
});

test('does not regress a completed phase when a late active event arrives', () => {
  const completed = apply(
    createAgentProgress(1_000),
    event('intent', 'completed', 50),
  );
  const result = reduceProgressEvent(completed, event('normalize', 'active', 20), 2_000);

  assert.deepEqual(result, completed);
});

test('ignores unknown technical stages and invalid elapsed values', () => {
  const initial = createAgentProgress(1_000);
  const unknown = reduceProgressEvent(initial, event('internal_tool_name', 'active'), 1_100);
  const invalid = reduceProgressEvent(initial, event('request', 'active', Number.NaN), 1_100);

  assert.equal(unknown, initial);
  assert.equal(invalid.lastElapsedMs, 0);
  assert.equal(invalid.steps[0]?.message, 'Đang phân tích yêu cầu của bạn...');
});

test('changes only lookup copy when data retrieval is slow', () => {
  const retrieving = reduceProgressEvent(createAgentProgress(0), event('tools', 'active'), 1_000);
  const waiting = updateProgressClock(retrieving, 8_100);
  const delayed = updateProgressClock(waiting, 16_100);

  assert.equal(waiting.steps.find(step => step.id === 'retrieve')?.message, 'Đang chờ dữ liệu từ hệ thống...');
  assert.equal(delayed.steps.find(step => step.id === 'retrieve')?.message, 'Quá trình tra cứu đang mất nhiều thời gian hơn dự kiến...');
});

test('first response text completes and collapses the progress with total time', () => {
  const running = apply(
    createAgentProgress(1_000),
    event('compose', 'active', 2_500),
    event('compose', 'completed', 3_000),
  );
  const result = completeAgentProgress(running, 4_800);

  assert.equal(result.summaryStatus, 'completed');
  assert.equal(result.collapsed, true);
  assert.equal(result.totalElapsedMs, 3_800);
  assert.equal(result.steps.at(-1)?.status, 'completed');
});

test('error and cancellation are terminal and never leave an active step', () => {
  const running = reduceProgressEvent(createAgentProgress(1_000), event('tools', 'active'), 1_100);
  const failed = failAgentProgress(running, 2_000);
  const cancelled = cancelAgentProgress(running);

  assert.equal(failed.summaryStatus, 'error');
  assert.equal(failed.steps.some(step => step.status === 'active'), false);
  assert.equal(cancelled.summaryStatus, 'cancelled');
  assert.equal(cancelled.steps.some(step => step.status === 'active'), false);
  assert.equal(completeAgentProgress(failed, 3_000), failed);
});

test('warning can continue and retrying uses safe user-facing copy', () => {
  const warning = reduceProgressEvent(
    createAgentProgress(1_000),
    event('tools', 'warning', 500),
    1_500,
  );
  const retrying = reduceProgressEvent(warning, event('tools', 'retrying', 700), 1_700);
  const continued = reduceProgressEvent(retrying, event('compose', 'active', 900), 1_900);

  assert.equal(warning.summaryStatus, 'running');
  assert.equal(warning.steps.find(step => step.id === 'retrieve')?.message, 'Chưa tìm thấy đầy đủ thông tin');
  assert.equal(retrying.steps.find(step => step.id === 'retrieve')?.status, 'active');
  assert.equal(retrying.steps.find(step => step.id === 'retrieve')?.message, 'Kết nối chưa ổn định, đang thử lại...');
  assert.equal(continued.steps.filter(step => step.status === 'active').length, 1);
  assert.equal(continued.steps.at(-1)?.id, 'synthesize');
});
