"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "next-share";
import { useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  title?: string;
}

export function ShareDialog({ open, onOpenChange, shareUrl, title = "Check this out!" }: ShareDialogProps) {
  console.log("[ShareDialog] title:", title);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1c1c1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Share this creation</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <FacebookShareButton url={shareUrl} quote={title} hashtag="#BestMakerAI">
              <FacebookIcon size={48} round />
            </FacebookShareButton>
            <TwitterShareButton url={shareUrl} title={title}>
              <TwitterIcon size={48} round />
            </TwitterShareButton>
            <WhatsappShareButton url={shareUrl} title={title} separator=":: ">
              <WhatsappIcon size={48} round />
            </WhatsappShareButton>
            <LinkedinShareButton url={shareUrl}>
              <LinkedinIcon size={48} round />
            </LinkedinShareButton>
            <RedditShareButton url={shareUrl} title={title}>
              <RedditIcon size={48} round />
            </RedditShareButton>
            <TelegramShareButton url={shareUrl} title={title}>
              <TelegramIcon size={48} round />
            </TelegramShareButton>
            <EmailShareButton url={shareUrl} subject={title} body="Check this out:">
              <EmailIcon size={48} round />
            </EmailShareButton>
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
                className="h-9 bg-white/5 border-white/10 text-white/90"
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
