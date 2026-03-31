import { useState, useEffect } from 'react'
import { Slack, Bell, Lock, Building2, Edit2 } from 'lucide-react'
import { getDepartments, updateDepartment } from '../services/api.js'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const [editingIndex, setEditingIndex] = useState(null)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error)
  }, [])

  const handleEdit = (index) => setEditingIndex(index)

  const handleSlackChannelChange = (index, value) => {
    const updated = [...departments]
    updated[index].slack_channel = value
    setDepartments(updated)
  }

  const handleSaveEdit = async (dept) => {
    try {
      const updated = await updateDepartment(dept.id, { slack_channel: dept.slack_channel })
      setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d))
      setEditingIndex(null)
      toast.success('Slack 채널이 업데이트되었습니다!')
    } catch (e) {
      toast.error('저장 실패: ' + e.message)
    }
  }

  const handleSave = () => toast.success('설정이 저장되었습니다!')

  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 페이지 헤더 */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>설정</h1>
        <p style={{ fontSize: 14, color: '#6B7280' }}>Slack 연동 및 부서 채널을 관리하세요</p>
      </div>

      <div className="max-w-4xl space-y-6">

      {/* Slack 연동 설정 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Slack className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Slack 연동 설정</h3>
            <p className="text-sm text-gray-600">슬랙 워크스페이스와 연결하여 알림을 받으세요</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="slack-webhook">Webhook URL</Label>
            <Input
              id="slack-webhook"
              type="text"
              placeholder="https://hooks.slack.com/services/..."
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Slack 워크스페이스의 Incoming Webhook URL을 입력하세요</p>
          </div>

          <div>
            <Label htmlFor="default-channel">기본 채널</Label>
            <Input id="default-channel" type="text" placeholder="#general" className="mt-2" />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">실시간 알림</p>
              <p className="text-sm text-gray-600">문서 업로드 시 즉시 알림 전송</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* 부서 관리 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">부서 관리</h3>
            <p className="text-sm text-gray-600">각 부서의 Slack 채널을 설정하세요</p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700 w-1/3">부서명</TableHead>
                <TableHead className="font-semibold text-gray-700 w-1/2">연동될 Slack 채널</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24 text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept, index) => (
                <TableRow key={dept.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      {dept.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        value={dept.slack_channel || ''}
                        onChange={e => handleSlackChannelChange(index, e.target.value)}
                        placeholder="#channel-name"
                        className="max-w-xs"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(dept)
                          if (e.key === 'Escape') setEditingIndex(null)
                        }}
                      />
                    ) : (
                      <span className="text-gray-700 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {dept.slack_channel || '미설정'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingIndex === index ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveEdit(dept)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        저장
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(index)}
                        className="text-gray-600 hover:text-gray-900 gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        편집
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" className="w-full mt-4">새 부서 추가</Button>
      </Card>

      {/* 알림 설정 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">알림 설정</h3>
            <p className="text-sm text-gray-600">받고 싶은 알림을 선택하세요</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">문서 업로드 완료</p>
              <p className="text-sm text-gray-600">파일 업로드가 완료되면 알림</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">AI 분석 완료</p>
              <p className="text-sm text-gray-600">문서 분석이 완료되면 알림</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">승인 요청</p>
              <p className="text-sm text-gray-600">승인이 필요한 문서가 있을 때 알림</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* 보안 설정 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">보안 설정</h3>
            <p className="text-sm text-gray-600">데이터 보안 및 접근 제어</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">2단계 인증</p>
              <p className="text-sm text-gray-600">추가 보안 레이어 활성화</p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">자동 로그아웃</p>
              <p className="text-sm text-gray-600">30분 비활성 시 자동 로그아웃</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
          설정 저장
        </Button>
      </div>
      </div>
    </div>
  )
}
