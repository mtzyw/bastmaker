import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, Link, Share, MoreHorizontal, Copy, Video, ImageIcon, Zap } from "lucide-react"

export function ImageGenerator() {
  return (
    <Card className="max-w-7xl mx-auto bg-card border-border overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Main Image Display */}
        <div className="lg:col-span-2 p-6 border-r border-border">
          <div className="aspect-[3/4] bg-gradient-to-br from-teal-400 to-orange-300 rounded-lg overflow-hidden">
            <img src="/placeholder-abvcp.png" alt="Generated anime character" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Control Panel */}
        <div className="p-6 space-y-6 bg-muted/30">
          {/* User Info */}
          <div className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-orange-500 text-white text-sm">ND</AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">NA DIAO</span>
              </div>
              <span className="text-muted-foreground text-sm">2025-09-24 11:43</span>
            </div>
          </div>

          {/* Generation Details */}
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Image to Image</div>

            <div>
              <h3 className="text-foreground font-medium mb-2">Image</h3>
              <div className="w-16 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded overflow-hidden">
                <img
                  src="/small-anime-character-thumbnail.jpg"
                  alt="Input image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-foreground font-medium">Prompt</label>
                <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
              </div>
              <Textarea
                value="古卜力风格"
                readOnly
                className="min-h-[60px] bg-background border-border text-foreground resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="text-foreground">Pollo Image 1.6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output Dimension:</span>
                <span className="text-foreground">832 × 1248</span>
              </div>
            </div>

            <div>
              <h4 className="text-foreground font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Anime Style
                </Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Vibrant Colors
                </Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Cute Character
                </Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Whimsical Theme
                </Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Bold Design
                </Badge>
              </div>
            </div>
          </div>

          {/* Generation Options */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-foreground font-medium">Generate</h4>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="justify-start h-10 border-border bg-transparent">
                <Video className="h-4 w-4 mr-2" />
                Image to Video
              </Button>
              <Button variant="outline" className="justify-start h-10 border-border bg-transparent">
                <ImageIcon className="h-4 w-4 mr-2" />
                Image to Image
              </Button>
              <Button variant="outline" className="justify-start h-10 border-border bg-transparent">
                <Zap className="h-4 w-4 mr-2" />
                Image to Shorts
              </Button>
            </div>

            <Button variant="outline" className="w-full justify-start h-10 border-border bg-transparent">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
              </Avatar>
              AI Avatar
            </Button>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="p-2">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Share className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">Create Similar Image</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
