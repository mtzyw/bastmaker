"use client";

import { updateUserSettingsAction } from "@/actions/users/settings";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_ALLOWED_EXTENSIONS,
  AVATAR_ALLOWED_FILE_TYPES,
  AVATAR_MAX_FILE_SIZE,
  FULL_NAME_MAX_LENGTH,
  isValidFullName,
} from "@/lib/validations";
import { AlertCircle, Camera, Loader2, Mail, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const t = useTranslations("Settings");
  const locale = useLocale();

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || "");
  }, [user]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);

    if (value.length > FULL_NAME_MAX_LENGTH) {
      setFullNameError(
        t("toast.fullNameLengthError", {
          maxLength: FULL_NAME_MAX_LENGTH,
        })
      );
    } else if (value && !isValidFullName(value)) {
      setFullNameError(t("toast.fullNameInvalidCharactersError"));
    } else {
      setFullNameError("");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(t("toast.errorInvalidFileType"), {
        description: t("toast.errorInvalidFileTypeDescription", {
          allowedTypes: AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase(),
        }),
      });
      e.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_FILE_SIZE) {
      toast.error(t("toast.errorFileSizeExceeded"), {
        description: t("toast.errorFileSizeExceededDescription", {
          maxSizeInMB: AVATAR_MAX_FILE_SIZE / 1024 / 1024,
        }),
      });
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullNameError || !fullName.trim()) {
      toast.error(t("toast.errorInvalidFullName"), {
        description: fullNameError || t("toast.errorFullNameRequired"),
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", fullName.trim());
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const result = await updateUserSettingsAction({
        formData,
        locale: locale || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(t("toast.updateSuccessTitle"), {
        description: t("toast.updateSuccessDescription"),
      });

      await refreshUser();
      setAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      toast.error(t("toast.updateErrorTitle"), {
        description:
          error instanceof Error
            ? error.message
            : t("toast.updateErrorDescription"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          {t("title") || "Settings"}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("description") || "Manage your account settings and preferences."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture Card */}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              <h2 className="text-xl font-semibold">
                {t("sections.profile") || "Profile"}
              </h2>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {t("sections.profileDescription") ||
                "Your personal profile information."}
            </p>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                {t("form.fullNameLabel") || "Full Name"}
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={handleFullNameChange}
                  placeholder={
                    t("form.fullNamePlaceholder") || "Enter your full name"
                  }
                  maxLength={FULL_NAME_MAX_LENGTH}
                  className={`max-w-md transition-all ${
                    fullNameError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "focus:border-primary focus:ring-primary/20"
                  }`}
                />
                {fullNameError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{fullNameError}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("form.fullNameHint", {
                    maxLength: FULL_NAME_MAX_LENGTH,
                  }) ||
                    `Your display name. Maximum ${FULL_NAME_MAX_LENGTH} characters.`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">
                {t("form.avatarLabel") || "Avatar"}
              </Label>

              <div className="flex items-start gap-6">
                {/* Avatar Preview */}
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-muted">
                    <AvatarImage
                      src={
                        previewUrl ||
                        user?.user_metadata?.avatar_url ||
                        undefined
                      }
                      alt={user?.user_metadata?.full_name || "User avatar"}
                    />
                    <AvatarFallback className="text-lg">
                      {user?.user_metadata?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {(previewUrl || avatarFile) && (
                    <div className="absolute -bottom-2 -right-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full p-1">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept={AVATAR_ACCEPT_ATTRIBUTE}
                      onChange={handleAvatarChange}
                      className="max-w-sm cursor-pointer file:cursor-pointer"
                      lang="en"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("form.avatarHint", {
                        maxSizeInMB: AVATAR_MAX_FILE_SIZE / 1024 / 1024,
                        allowedTypes:
                          AVATAR_ALLOWED_EXTENSIONS.join(", ").toUpperCase(),
                      }) ||
                        `Upload a picture. Max size: ${
                          AVATAR_MAX_FILE_SIZE / 1024 / 1024
                        }MB. Formats: ${AVATAR_ALLOWED_EXTENSIONS.join(
                          ", "
                        ).toUpperCase()}.`}
                    </p>
                  </div>

                  {avatarFile && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t("form.avatarSelected") ||
                          "New avatar selected. Save changes to apply."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFullName(user?.user_metadata?.full_name || "");
                  setAvatarFile(null);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                  setFullNameError("");
                  const fileInput = document.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;
                  if (fileInput) {
                    fileInput.value = "";
                  }
                }}
                disabled={isLoading}
                className="h-11 px-6"
              >
                {t("form.resetButton") || "Reset Changes"}
              </Button>

              <Button
                type="submit"
                disabled={isLoading || !!fullNameError || !fullName.trim()}
                className="h-11 px-6 gap-2 font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("form.updatingButton") || "Updating..."}</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>{t("form.updateButton") || "Save Changes"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6" />
              <h2 className="text-xl font-semibold">
                {t("sections.account") || "Account Information"}
              </h2>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {t("sections.accountDescription") ||
                "Your basic account information and contact details."}
            </p>

            {/* Email Field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("form.emailLabel") || "Email Address"}
              </Label>
              <Input
                defaultValue={user?.email}
                disabled
                className="bg-muted/50 border-muted max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                {t("form.emailHint") || "Your email address cannot be changed."}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
