"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Download,
  Edit,
  Trash2,
  Search,
  Plus,
  File,
  ImageIcon,
  Video,
  Music,
  Archive,
  BookOpen,
  Calendar,
  User,
  Eye,
  FolderOpen,
} from "lucide-react"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid";

import type { Resource } from "../lib/data";

export function Resources() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useSupabaseData()
  const resources = data.resources
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    courseId: "",
    category: "document" as Resource["category"],
    isPublic: true,
    tags: "",
  })

  // All hooks are above.
  useEffect(() => {
    // Filter resources based on search and filters
    let filtered = resources

    if (searchTerm) {
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedCourse !== "all") {
      filtered = filtered.filter((resource) => resource.courseId === selectedCourse)
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((resource) => resource.category === selectedCategory)
    }

    // Filter by user role
    if (user?.role === "student") {
      filtered = filtered.filter((resource) => resource.isPublic)
    }

    setFilteredResources(filtered)
  }, [resources, searchTerm, selectedCourse, selectedCategory, user?.role])

  // Now handle loading/error states below:
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-60 z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
        <span className="text-lg text-blue-700">Loading resources...</span>
      </div>
    </div>
  )
  if (error) return <div>Error loading resources: {error}</div>

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-detect category based on file type
      const fileType = file.type
      let category: Resource["category"] = "other"

      if (fileType.startsWith("image/")) category = "image"
      else if (fileType.startsWith("video/")) category = "video"
      else if (fileType.startsWith("audio/")) category = "audio"
      else if (fileType.includes("pdf") || fileType.includes("document")) category = "document"
      else if (fileType.includes("presentation")) category = "presentation"

      setFormData((prev) => ({ ...prev, category }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      const newResource: Resource = {
        id: editingResource?.id || uuidv4(),
        title: formData.title,
        description: formData.description,
        content: formData.content,
        courseId: formData.courseId,
        category: formData.category,
        uploadedBy: user?.id || "",
        uploadDate: editingResource?.uploadDate || new Date().toISOString(),
        isPublic: formData.isPublic,
        downloadCount: editingResource?.downloadCount || 0,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        fileType: selectedFile?.type,
        fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : editingResource?.fileUrl,
      }

      if (editingResource) {
        // Update existing resource in Supabase
        await supabase
          .from('resources')
          .update(newResource)
          .eq('id', editingResource.id);
      } else {
        // Add new resource to Supabase
        await supabase
          .from('resources')
          .insert([newResource]);
      }
      await refetch();

      // Reset form
      setFormData({
        title: "",
        description: "",
        content: "",
        courseId: "",
        category: "document",
        isPublic: true,
        tags: "",
      })
      setSelectedFile(null)
      setEditingResource(null)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error saving resource:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description,
      content: resource.content || "",
      courseId: resource.courseId, // use camelCase for UI/state
      category: resource.category,
      isPublic: resource.isPublic,
      tags: resource.tags.join(", "),
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (resourceId: string) => {
    await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);
    await refetch();
  }

  const handleDownload = async (resource: Resource) => {
    if (resource.fileUrl) {
      const link = document.createElement("a");
      link.href = resource.fileUrl;
      link.download = resource.fileName || resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count in Supabase
      await supabase
        .from('resources')
        .update({ downloadCount: (resource.downloadCount || 0) + 1 })
        .eq('id', resource.id);
      await refetch();
    }
  }

  const getFileIcon = (category: Resource["category"]) => {
    switch (category) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "presentation":
        return <FileText className="h-4 w-4" />
      case "document":
        return <File className="h-4 w-4" />
      case "assignment":
        return <BookOpen className="h-4 w-4" />
      case "reading":
        return <BookOpen className="h-4 w-4" />
      default:
        return <Archive className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const canManageResource = (resource: Resource) => {
    return user?.role === "admin" || resource.uploadedBy === user?.id
  }

  const userCourses =
    user?.role === "admin"
      ? data.courses
      : data.courses?.filter(
          (course) => course.instructorid === user?.id || course.studentids?.includes(user?.id || ""),
        ) || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">Manage course materials, documents, and learning resources</p>
        </div>
        {(user?.role === "admin" || user?.role === "instructor") && (
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) {
                setFormData({
                  title: "",
                  description: "",
                  content: "",
                  courseId: "",
                  category: "document",
                  isPublic: true,
                  tags: "",
                })
                setSelectedFile(null)
                setEditingResource(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
                <DialogDescription>Upload files or create text-based resources for your courses</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Select
                      value={formData.courseId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, courseId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {userCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: Resource["category"]) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., lecture, homework, reference"
                    />
                  </div>
                </div>

                <Tabs defaultValue="file" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">File Upload</TabsTrigger>
                    <TabsTrigger value="text">Text Content</TabsTrigger>
                  </TabsList>
                  <TabsContent value="file" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Upload File</Label>
                      <Input id="file" type="file" onChange={handleFileSelect} accept="*/*" />
                      {selectedFile && (
                        <div className="text-sm text-muted-foreground">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content">Text Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                        rows={8}
                        placeholder="Enter text content, links, or instructions..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  <Label htmlFor="isPublic">Make this resource public to all students</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Saving..." : editingResource ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {userCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="presentation">Presentations</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
            <SelectItem value="reading">Readings</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const course = data.courses?.find((c) => c.id === resource.courseId)
          const uploader = data.users?.find((u) => u.id === resource.uploadedBy)

          return (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(resource.category)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{resource.title}</CardTitle>
                      <CardDescription className="text-sm">{course?.name}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {resource.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>

                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{uploader?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(resource.uploadDate), "MMM dd, yyyy")}</span>
                  </div>
                </div>

                {resource.fileName && (
                  <div className="text-xs text-muted-foreground">
                    {resource.fileName} • {formatFileSize(resource.fileSize)}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>{resource.downloadCount} downloads</span>
                  </div>
                  {!resource.isPublic && (
                    <Badge variant="outline" className="text-xs">
                      Private
                    </Badge>
                  )}
                </div>

                <div className="flex space-x-2">
                  {resource.fileUrl && (
                    <Button size="sm" variant="outline" onClick={() => handleDownload(resource)} className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {resource.content && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{resource.title}</DialogTitle>
                          <DialogDescription>{resource.description}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <pre className="whitespace-pre-wrap text-sm">{resource.content}</pre>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {canManageResource(resource) && (
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(resource)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(resource.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No resources found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCourse !== "all" || selectedCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by adding your first resource"}
          </p>
          {(user?.role === "admin" || user?.role === "instructor") && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
