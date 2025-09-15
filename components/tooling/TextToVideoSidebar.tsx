"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function TextToVideoSidebar() {
  return (
    <div className="space-y-4">
      <div className={cn("rounded-lg border bg-card p-4")}> 
        <div className="text-sm font-medium mb-2">Text to Video</div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea id="prompt" placeholder="Describe your scene..." className="min-h-[96px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select defaultValue="720p">
                <SelectTrigger><SelectValue placeholder="Resolution" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">1280×720</SelectItem>
                  <SelectItem value="1080p">1920×1080</SelectItem>
                  <SelectItem value="square">1024×1024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select defaultValue="5s">
                <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">5s</SelectItem>
                  <SelectItem value="10s">10s</SelectItem>
                  <SelectItem value="15s">15s</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Style Preset</Label>
            <Select defaultValue="cinematic">
              <SelectTrigger><SelectValue placeholder="Style" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Seed</Label>
              <Input placeholder="Random" />
            </div>
            <div className="flex items-end justify-between">
              <Label className="text-sm">High Quality</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        <div className="pt-4">
          <Button className="w-full">Create</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-medium mb-2">Advanced</div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Motion Strength</Label>
            <Slider defaultValue={[60]} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Guidance Scale</Label>
            <Slider defaultValue={[70]} max={100} step={1} />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="text-sm font-medium mb-2">Shortcuts</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Button variant="secondary">Landscape</Button>
          <Button variant="secondary">Portrait</Button>
          <Button variant="secondary">Square</Button>
        </div>
      </div>
    </div>
  );
}

