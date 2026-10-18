import React from 'react';
import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import NavigationManager from '../src/pages/platform/NavigationManager';
import api from '../src/services/api';
vi.mock('../src/services/api', () => ({ default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const existing = { id: 1, name: 'Main', handle: 'main', locations: ['header'], isActive: true, updatedAt: '2026-10-16T10:00:00.000Z', items: [
  { id: 'a', label: 'About', type: 'page', pageId: 1, newTab: false, isActive: true, children: [] },
  { id: 's', label: 'Shop', type: 'custom', url: '/shop', newTab: false, isActive: true, children: [] },
] };
beforeEach(() => {
  api.get.mockImplementation(async url => ({ data: { data: url.endsWith('/pages') ? [{ id: 1, title: 'About', slug: 'about', isPublished: true }] : url.endsWith('/locations') ? ['header', 'footer'] : [structuredClone(existing)] } }));
  api.put.mockImplementation(async (_url, body) => ({ data: { data: { ...body, id: 1, updatedAt: '2026-10-16T10:01:00.000Z' } } }));
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it('creates page menu and assigns header without entering JSON', async () => {
  render(<NavigationManager />); await screen.findByRole('button', { name: '+ About' });
  fireEvent.change(screen.getByLabelText('Menu name'), { target: { value: 'New menu' } });
  fireEvent.change(screen.getByLabelText('Handle'), { target: { value: 'new-menu' } });
  fireEvent.click(screen.getByRole('button', { name: '+ About' }));
  fireEvent.click(screen.getByLabelText('Main header'));
  fireEvent.click(screen.getByRole('button', { name: 'Save menu' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/content/navigation/new-menu', expect.objectContaining({ locations: ['header'], items: [expect.objectContaining({ type: 'page', pageId: 1, label: 'About' })] })));
  expect(await screen.findByRole('status')).toBeTruthy();
});
it('dragging into a submenu saves hierarchy and version', async () => {
  render(<NavigationManager />); await screen.findByRole('button', { name: '+ About' });
  fireEvent.change(screen.getByLabelText('Select menu'), { target: { value: 'main' } });
  const grips = screen.getAllByTitle('Drag to move this item');
  fireEvent.dragStart(grips[1], { dataTransfer: { setData: vi.fn() } });
  fireEvent.drop(screen.getByText('Drop as submenu'));
  fireEvent.click(screen.getByRole('button', { name: 'Save menu' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/content/navigation/main', expect.objectContaining({ expectedUpdatedAt: existing.updatedAt, items: [expect.objectContaining({ id: 'a', children: [expect.objectContaining({ id: 's' })] })] })));
});
it('stale saves show conflict and retain edited menu', async () => {
  api.put.mockRejectedValue({ response: { status: 409, data: { message: 'This menu changed. Reload it before saving.' } } });
  render(<NavigationManager />); await screen.findByRole('button', { name: '+ About' });
  fireEvent.change(screen.getByLabelText('Select menu'), { target: { value: 'main' } });
  fireEvent.change(screen.getByLabelText('Menu name'), { target: { value: 'Edited main' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save menu' }));
  expect((await screen.findByRole('alert')).textContent).toMatch(/Reload/);
  expect(screen.getByLabelText('Menu name').value).toBe('Edited main');
});
