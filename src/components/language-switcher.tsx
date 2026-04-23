'use client';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_LANGUAGES, type SupportedLanguage, useLanguage } from '@/context/language-context';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const activeLanguage = SUPPORTED_LANGUAGES.find((entry) => entry.code === language)?.label ?? 'English';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full border-border/40 bg-background/80 backdrop-blur-sm">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{activeLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('Language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as SupportedLanguage)}>
          {SUPPORTED_LANGUAGES.map((entry) => (
            <DropdownMenuRadioItem key={entry.code} value={entry.code}>
              {entry.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
