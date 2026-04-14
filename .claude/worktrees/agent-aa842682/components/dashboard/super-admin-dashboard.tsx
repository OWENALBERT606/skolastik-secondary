import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  School,
  BookOpen,
  TrendingUp,
  Calendar,
  Bell,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  UserCheck,
  Clock,
} from "lucide-react"

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Super Admin</h2>
          <p className="text-muted-foreground">Here's what's happening across your school network today.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schools Onboarded</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">24</div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-xs">
                  22 Active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  2 Inactive
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-chart-2">+2</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12,847</div>
              <p className="text-xs text-muted-foreground">Across all schools</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-chart-2">+5.2%</span> from last term
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers & Parents</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">3,892</div>
              <div className="flex items-center gap-2 text-xs">
                <span>1,256 Teachers</span>
                <span>•</span>
                <span>2,636 Parents</span>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-chart-2">+47</span> new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">8,456</div>
              <p className="text-xs text-muted-foreground">Current term reports</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-chart-2">+1,234</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Terms</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">18</div>
              <p className="text-xs text-muted-foreground">Academic years: 24</p>
              <p className="text-xs text-muted-foreground">Terms in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">98.5%</div>
              <p className="text-xs text-muted-foreground">Uptime this month</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                <span className="text-xs text-muted-foreground">All systems operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* School Performance Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                School Performance Overview
              </CardTitle>
              <CardDescription>Academic performance across all schools this term</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Greenfield Academy</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Riverside High School</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Oakwood Elementary</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Central Middle School</span>
                    <span className="font-medium">79%</span>
                  </div>
                  <Progress value={79} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-chart-1 rounded-full mt-2"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">New school onboarded</p>
                    <p className="text-xs text-muted-foreground">Sunset Elementary joined the network</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />2 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Bulk report generation</p>
                    <p className="text-xs text-muted-foreground">Term 2 reports for 3,247 students completed</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />5 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Admin login activity</p>
                    <p className="text-xs text-muted-foreground">15 school admins logged in today</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />8 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-chart-4 rounded-full mt-2"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Academic year setup</p>
                    <p className="text-xs text-muted-foreground">2024-2025 terms configured for 3 schools</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />1 day ago
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Academic Terms Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Academic Years & Terms Status
              </CardTitle>
              <CardDescription>Current academic periods across all schools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Academic Year 2023-2024</p>
                    <p className="text-sm text-muted-foreground">Term 2: January - April</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active Terms</p>
                    <p className="font-medium">18/24 schools</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed Exams</p>
                    <p className="font-medium">156/240</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Upcoming: Academic Year 2024-2025</p>
                    <Badge variant="outline">Planning</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">6 schools have configured their terms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button className="justify-start bg-transparent" variant="outline">
                  <School className="mr-2 h-4 w-4" />
                  Add New School
                </Button>
                <Button className="justify-start bg-transparent" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate System Report
                </Button>
                <Button className="justify-start bg-transparent" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Manage User Roles
                </Button>
                <Button className="justify-start bg-transparent" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
