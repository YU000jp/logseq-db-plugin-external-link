import '@logseq/libs' //https://plugins-doc.logseq.com/
import { BlockEntity } from '@logseq/libs/dist/LSPlugin.user'
import { setup as l10nSetup, t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { getTitleFromURL } from './getTitle'
import { settingsTemplate } from './settings'
import af from "./translations/af.json"
import de from "./translations/de.json"
import es from "./translations/es.json"
import fr from "./translations/fr.json"
import id from "./translations/id.json"
import it from "./translations/it.json"
import ja from "./translations/ja.json"
import ko from "./translations/ko.json"
import nbNO from "./translations/nb-NO.json"
import nl from "./translations/nl.json"
import pl from "./translations/pl.json"
import ptBR from "./translations/pt-BR.json"
import ptPT from "./translations/pt-PT.json"
import ru from "./translations/ru.json"
import sk from "./translations/sk.json"
import tr from "./translations/tr.json"
import uk from "./translations/uk.json"
import zhCN from "./translations/zh-CN.json"
import zhHant from "./translations/zh-Hant.json"


/* main */
const main = async () => {

    await l10nSetup({
        builtinTranslations: {//Full translations
            ja, af, de, es, fr, id, it, ko, "nb-NO": nbNO, nl, pl, "pt-BR": ptBR, "pt-PT": ptPT, ru, sk, tr, uk, "zh-CN": zhCN, "zh-Hant": zhHant
        }
    })

    /* user settings */
    logseq.useSettingsSchema(settingsTemplate())

    if (!logseq.settings)
        setTimeout(() => logseq.showSettingsUI(), 300)

    logseq.App.onSidebarVisibleChanged(async ({ visible }) => {
        if (visible === true)
            callback()
    })

    setTimeout(() => observerMainRight(), 500)

    // logseq.onSettingsChanged((newSet: LSPluginBaseInfo['settings'], oldSet: LSPluginBaseInfo['settings']) => {
    //     //更新されたら
    //     if (newSet.firstLetter !== oldSet.firstLetter
    //         || newSet.eliminatesLevels !== oldSet.eliminatesLevels
    //         || newSet.booleanUseDot !== oldSet.booleanUseDot
    //         || newSet.iconMode !== oldSet.iconMode
    //     ) restoreAll()
    // })

    logseq.beforeunload(async () => {
        restoreAll()
    })

}/* end_main */


const callback = () => {
    //callback関数
    observer.disconnect()
    pageRefQuerySelectorAll()
    setTimeout(() => observerMainRight(), 500)
}

// コールバック関数に結びつけられたオブザーバーのインスタンスを生成
const observer = new MutationObserver(callback)



//セレクターに一致するエレメントに処理をおこなう

let processingQuery: boolean = false
const pageRefQuerySelectorAll = () => {
    if (processingQuery === true) return
    processingQuery = true
    setTimeout(() => {
        setTimeout(() => processingQuery = false, 200)
        parent.document.body.querySelectorAll(
            ':is(#main-content-container,#right-sidebar) a.external-link:not([data-button-added="true"])[target="_blank"]:is([href^="http://"],[href^="https://"])'
        ).forEach(
            (element) => foundLink(element as HTMLAnchorElement)
        )
    }, 100)
}


const foundLink = (element: HTMLAnchorElement) => {
    // 既にボタンが追加されているか確認
    if (element.dataset.buttonAdded === "true") return

    const url = element.href

    // console.log(element.textContent)
    // console.log(element.href)

    if (element.textContent === url) { // URLに一致する外部リンク

        //変換ボタンを設置する(ボタンをクリックしたらユーザー確認もしくはそのまま実行)
        const button = document.createElement('button')
        button.textContent = logseq.settings!.icon as string || "🛜" // ユーザー指定のアイコン
        button.classList.add("external-link-submit-button")
        button.title = t("Get the title from the site and convert the URL string in the block to markdown")
        button.onclick = () => handleButtonClick(button, url)// ボタンがクリックされたときの処理
        element.after(button)

    } else {
        // URL以外の文字列の外部リンク
    }
    // フラグを設定
    element.dataset.buttonAdded = "true"
}


const msgNotFoundBlock = "ERROR: The block could not be found.\nURL: "


const handleButtonClick = async (buttonElement: HTMLButtonElement, url: string) => {
    //TODO:

    //エレメント「div.block-content[data-type="default"][blockid]:has(a.external-link[href="url"])」を探し、blockidを取得する
    const blockElement = parent.document.body.querySelector(`:is(#main-content-container,#right-sidebar) div.block-content[data-type="default"][blockid][id]:has(a.external-link[href="${url}"])`) as HTMLElement | null
    if (blockElement) {
        const blockUuid = blockElement.id.replace("block-content-", "")
        if (blockUuid) {
            // alert(`Block found.\nURL: "${url}\nblockUuid: ${blockUuid}`)
            if (await convertUrlInBlock(url, blockUuid) as boolean) // success true
                buttonElement.style.display = "none"//URLをマークダウンに変換した後にボタンを消す
            return
        }
    }
    // blockElementもしくはblockUuidが見つからない場合
    alert(msgNotFoundBlock + url)
}

const convertUrlInBlock = async (url: string, blockUuid: BlockEntity["uuid"]): Promise<boolean> => {

    const blockEntity = await logseq.Editor.getBlock(blockUuid, { includeChildren: false }) as { content: BlockEntity["content"] }

    if (blockEntity) {
        // alert("BlockEntity found.\nURL: " + url)
        //console.log(BlockEntity)

        // ユーザー操作でsubmitされた場合

        let title = await getTitleFromURL(url)
        if (title === "") {
            const msg = `${t("Title could not be retrieved from the site.")}\n${t("If the site is strict about fetch, nothing can be retrieved.")}`
            logseq.UI.showMsg(msg + `\n\nURL: ${url}`, "info", { timeout: 3000 })
            console.log(msg)

            // もし、取得できない場合も、マークダウンを挿入するかどうか
            if (logseq.settings!.booleanInsertIfNotFoundTitle as boolean === true) {
                title = t("Title") //ブロックを更新数r
            } else
                return false //終了

        }
        const replacedTitle = title
            .replace("[", "")
            .replace("]", "")
            .replace(/[\n()\[\]]|{{|}}|#\+/g, (match) => {
                switch (match) {
                    case "{{":
                        return "{"
                    case "}}":
                        return "}"
                    case "#+":
                        return " "
                    default:
                        return ""
                }
            })

        const blockContent = blockEntity.content
            .replace(`[${url}](${url})`, `[${replacedTitle}](${url})`)
            .replace(url, `[${replacedTitle}](${url})`)

        await logseq.Editor.updateBlock(blockUuid, blockContent)

        // 成功した場合
        return true

    } else {
        // ブロックが見つからない場合
        alert(msgNotFoundBlock + url)

        // キャンセルの場合
        return false
    }
}


const observerMainRight = () => {
    //対象ノードの監視スタート
    observer.observe(
        parent.document.getElementById("main-content-container") as HTMLDivElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    })
    observer.observe(
        parent.document.getElementById("right-sidebar") as HTMLDivElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    })
}


//元に戻す
const restoreAll = () => {
    parent.document.body.querySelectorAll(
        ':is(#main-content-container,#right-sidebar) button.external-link-submit-button'
    ).forEach((element) =>
        (element as HTMLElement).style.display = "none"
    )
}


logseq.ready(main).catch(console.error)