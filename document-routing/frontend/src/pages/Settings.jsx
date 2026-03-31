import { useState, useEffect } from 'react'
import { MessageSquare, Building2, Pencil } from 'lucide-react'
import { getDepartments, updateDepartment } from '../services/api.js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

export default function Settings() {
  const [departments, setDepartments] = useState([])
  const [slackConfig, setSlackConfig] = useState({ webhook: '', channel: '#general', realtime: true })
  const [editingId, setEditingId] = useState(null)
  const [editChannel, setEditChannel] = useState('')

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error)
  }, [])

  const startEdit = (dept) => {
    setEditingId(dept.id)
    setEditChannel(dept.slack_channel || '')
  }

  const saveEdit = async (deptId) => {
    try {
      const updated = await updateDepartment(deptId, { slack_channel: editChannel })
      setDepartments(prev => prev.map(d => d.id === deptId ? updated : d))
      setEditingId(null)
      toast.success('저장되었습니다')
    } catch (e) {
      toast.error('저장 실패: ' + e.message)
    }
  }

  return (
    <div className="p-8 space-y-4">
      {/* Slack 연동 설정 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#F5F3FF' }}>
            <MessageSquare size={17} style={{ color: '#7C3AED' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Slack 연동 설정</h2>
            <p className="text-xs text-gray-500 mt-0.5">슬랙 워크스페이스와 연결하여 알림을 받으세요</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="webhook" className="text-xs font-medium text-gray-700">Webhook URL</Label>
            <Input
              id="webhook"
              value={slackConfig.webhook}
              onChange={e => setSlackConfig(p => ({ ...p, webhook: e.target.value }))}
              placeholder="https://hooks.slack.com/services/..."
              className="text-sm"
            />
            <p className="text-xs text-gray-400">Slack 워크스페이스의 Incoming Webhook URL을 입력하세요</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channel" className="text-xs font-medium text-gray-700">기본 채널</Label>
            <Input
              id="channel"
              value={slackConfig.channel}
              onChange={e => setSlackConfig(p => ({ ...p, channel: e.target.value }))}
              className="text-sm"
            />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">실시간 알림</p>
              <p className="text-xs text-gray-500 mt-0.5">문서 업로드 시 즉시 알림 전송</p>
            </div>
            <Switch
              checked={slackConfig.realtime}
              onCheckedChange={val => setSlackConfig(p => ({ ...p, realtime: val }))}
            />
          </div>
        </div>
      </Card>

      {/* 부서 관리 */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#EEF0FF' }}>
              <Building2 size={17} style={{ color: '#5E6AD2' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">부서 관리</h2>
              <p className="text-xs text-gray-500 mt-0.5">각 부서의 Slack 채널을 설정하세요</p>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wide">부서명</TableHead>
              <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wide">연동될 Slack 채널</TableHead>
              <TableHead className="font-semibold text-gray-500 text-xs uppercase tracking-wide">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map(dept => (
              <TableRow key={dept.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#5E6AD2' }} />
                    <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {editingId === dept.id ? (
                    <Input
                      value={editChannel}
                      onChange={e => setEditChannel(e.target.value)}
                      className="h-7 text-sm w-40"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(dept.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  ) : (
                    <span className="text-xs px-2.5 py-1 font-mono rounded bg-gray-100 text-gray-600">
                      {dept.slack_channel || '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === dept.id ? (
                    <div className="flex gap-3">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-semibold"
                        style={{ color: '#5E6AD2' }}
                        onClick={() => saveEdit(dept.id)}
                      >
                        저장
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-gray-400"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 gap-1 text-xs text-gray-400 hover:text-blue-600"
                      onClick={() => startEdit(dept)}
                    >
                      <Pencil size={11} />
                      편집
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-3 border-t border-gray-200">
          <Button variant="outline" className="w-full text-sm border-dashed text-gray-400 hover:text-blue-600 hover:border-blue-400">
            + 새 부서 추가
          </Button>
        </div>
      </Card>
    </div>
  )
}
