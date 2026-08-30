import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, Mail, Globe, Sparkles, UserCheck, Briefcase, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'

export function ProfileView() {
  const { user, updateUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [roleTitle, setRoleTitle] = useState(user?.role_title || '')
  const [skills, setSkills] = useState((user?.skills || []).join(', '))
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [isOpenToWork, setIsOpenToWork] = useState(user?.is_open_to_work || false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
      setRoleTitle(user.role_title || '')
      setSkills((user.skills || []).join(', '))
      setGithubUrl(user.github_url || '')
      setLinkedinUrl(user.linkedin_url || '')
      setWebsiteUrl(user.website_url || '')
      setAvatarUrl(user.avatar_url || '')
      setIsOpenToWork(user.is_open_to_work || false)
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await updateUser({
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        role_title: roleTitle.trim() || undefined,
        skills: skillsArray,
        github_url: githubUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        is_open_to_work: isOpenToWork,
      })
      toast.success('Developer profile saved!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const initials = (displayName || user.username).substring(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full min-w-0">
      {/* Header Profile Card */}
      <Card className="border-border/80 bg-card p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border/80 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
            <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {displayName || user.username}
              </h2>
              <span className="px-2 py-0.2 rounded text-[10.5px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                {user.auth_provider}
              </span>
              {user.is_email_verified && (
                <span className="px-2 py-0.2 rounded text-[10.5px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              @{user.username} {user.email && `• ${user.email}`}
            </p>
            {roleTitle && (
              <p className="text-[12px] text-foreground font-medium flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{roleTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* Open to Work Toggle */}
        <div className="p-3 rounded-lg border border-border/70 bg-muted/20 flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-[12px] font-semibold text-foreground">
              Open to Work
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              {isOpenToWork ? 'Discoverable by teams' : 'Hidden from discovery'}
            </p>
          </div>
          <Button
            type="button"
            variant={isOpenToWork ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsOpenToWork(!isOpenToWork)}
            className="h-7 text-[11px]"
          >
            {isOpenToWork ? 'Enabled (ON)' : 'Disabled (OFF)'}
          </Button>
        </div>
      </Card>

      {/* Profile Form */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="text-base font-bold text-foreground">
            Profile Settings
          </CardTitle>
          <CardDescription className="text-[12px] text-muted-foreground">
            Manage your public identity, bio, skillset, and social profiles.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6 pt-2">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">Display Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">Role / Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Full Stack Engineer, Architect"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Bio</label>
              <Textarea
                rows={3}
                placeholder="Share your engineering background, favorite stacks, or interests..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Skills (Comma-separated)</label>
              <Input
                type="text"
                placeholder="React, TypeScript, Python, Flask, PostgreSQL, Docker"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Avatar Image URL</label>
              <Input
                type="url"
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="text-[13px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">GitHub Profile URL</label>
                <Input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-foreground">LinkedIn URL</label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Website / Portfolio</label>
              <Input
                type="url"
                placeholder="https://yourportfolio.dev"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="text-[13px]"
              />
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" size="sm" disabled={loading} className="text-[12.5px] font-medium">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
