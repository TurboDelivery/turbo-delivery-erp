// app/profile/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
 
  Building, 
  Calendar,
  Edit3,
  Save,
  Upload,
  Globe,
  Linkedin,
  Twitter,
} from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)
  const [userData, setUserData] = useState({
    name: "Alexandre Martin",
    email: "alexandre.martin@entreprise.com",
    phone: "+33 6 12 34 56 78",
    position: "Responsable Financier",
    department: "Finance",
    location: "Paris, France",
    bio: "Expert en gestion financière avec 8 ans d'expérience dans l'analyse des données financières et l'optimisation des processus de recouvrement.",
    joinDate: "15 Janvier 2020",
    avatar: "/avatars/alexandre.jpg",
    notifications: true,
    twoFactor: false,
    language: "fr"
  })

  const [socialLinks, setSocialLinks] = useState({
    linkedin: "alexandre-martin",
    twitter: "alex_martin",
    website: "alexandremartin.fr"
  })

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setIsEditing(false)
    // Ici vous ajouteriez la logique pour sauvegarder les données
    console.log("Données sauvegardées:", userData)
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center gap-2"
        >
          {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          {isEditing ? "Sauvegarder" : "Modifier le profil"}
        </Button>
      </div>

      <Tabs defaultValue="informations" className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 w-full">
          <TabsTrigger value="informations">Informations personnelles</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="social">Réseaux sociaux</TabsTrigger>
        </TabsList>

        {/* Informations personnelles */}
        <TabsContent value="informations">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Photo de profil</CardTitle>
                <CardDescription>
                  Cette image sera visible par les autres membres de l&apos;organisation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="text-3xl">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Changer la photo
                  </Button>
                )}
                <div className="text-center">
                  <p className="font-semibold">{userData.name}</p>
                  <p className="text-sm text-muted-foreground">{userData.position}</p>
                  <Badge variant="outline" className="mt-2">
                    <Building className="h-3 w-3 mr-1" />
                    {userData.department}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles ici.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste</Label>
                    <Input
                      id="position"
                      value={userData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    value={userData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={userData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis {userData.joinDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="securite">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Gérez vos paramètres de sécurité et vos mots de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <p className="text-sm text-muted-foreground">
                    Mettez à jour votre mot de passe régulièrement
                  </p>
                </div>
                <Button variant="outline">Changer le mot de passe</Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="2fa">Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
                </div>
                <Switch 
                  id="2fa" 
                  checked={userData.twoFactor}
                  onCheckedChange={(checked) => handleInputChange('twoFactor', checked.toString())}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Sessions actives</Label>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Paris, France</p>
                      <p className="text-sm text-muted-foreground">
                        Navigateur: Chrome • OS: Windows • Dernière activité: il y a 2 heures
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Actuelle
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Préférences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>
                Personnalisez votre expérience sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes pour les activités importantes
                  </p>
                </div>
                <Switch 
                  id="notifications" 
                  checked={userData.notifications}
                  onCheckedChange={(checked) => handleInputChange('notifications', checked.toString())}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select 
                  value={userData.language} 
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Réseaux sociaux */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Réseaux sociaux</CardTitle>
              <CardDescription>
                Ajoutez vos liens vers les réseaux sociaux professionnels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Votre identifiant LinkedIn"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Votre identifiant Twitter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site web personnel
                </Label>
                <Input
                  id="website"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Votre site web"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}