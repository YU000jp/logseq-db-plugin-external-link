import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
    

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = (): SettingSchemaDesc[] => [

          {
                    key: "booleanInsertIfNotFoundTitle" ,
                    title: t("Convert to markdown even if the title could not be retrieved from the URL."),
                    description: t("Toggle"),
                    default: true,
                    type: "boolean",
          },
          {
                    key: "icon",
                    title: t("Change icon (or as text)"),
                    description: t("Emoji or strings"),
                    default: "🔗",
                    type: "string",
          },
          
]
