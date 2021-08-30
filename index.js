import { promisify } from 'node:util'
import { join, sep } from 'node:path'
import { stat } from 'node:fs/promises'
import mri from 'mri'
import mkdirp from 'mkdirp'
import oldGlob from 'glob'
import symlink from 'fs-symlink'

const glob = promisify(oldGlob)

let { root: monorepoRootDirectory, folderPrefix, npmPrefix } = mri(process.argv.slice(2))
monorepoRootDirectory = monorepoRootDirectory || ''
folderPrefix = folderPrefix || '_'
npmPrefix = npmPrefix || '$'

const globOpts = { cwd: monorepoRootDirectory }

const onlyDirs = async name => (await stat(join(monorepoRootDirectory, name))).isDirectory()
	? name
	: false

const findLinkableDirs = () => Promise
	.all([
		glob(`${folderPrefix}*`, globOpts),
		glob(`*/*/${folderPrefix}*`, globOpts)
	])
	.then(
		([ rootFolders, appFolders ]) => Promise
			.all([
				Promise.all(rootFolders.map(onlyDirs)),
				Promise.all(appFolders.map(onlyDirs))
			])
	)
	.then(([ rootFolders, appFolders ]) => {
		return [ rootFolders.filter(Boolean), appFolders.filter(Boolean) ]
	})
	.then(([ rootFolders, appFolders ]) => {
		const rootNames = {}
		rootFolders.forEach(folder => { rootNames[folder] = folder })
		appFolders.forEach(folder => {
			const name = folder.split(sep).pop()
			if (rootNames[name]) throw new Error(`Root folder "${rootNames[name]}" cannot have same name as app folder "${folder}"`)
		})
		return { rootFolders, appFolders }
	})

export const symlinkMonorepo = async () => {
	const { rootFolders, appFolders } = await findLinkableDirs()
	const appMapping = appFolders
		.map(folder => {
			const [ appDir, appName, linkable ] = folder.split(sep)
			const name = linkable.split(folderPrefix).pop()
			return {
				appDirName: join(appDir, appName),
				linkable,
				name,
			}
		})
	const appDirNames = [ ...new Set(appMapping.map(m => m.appDirName)) ]
	// make the node_modules/$ folder in each app
	await Promise.all(appDirNames.map(appDirName => mkdirp(join(monorepoRootDirectory, appDirName, 'node_modules', '$'))))
	// make the node_modules/$/NAME for each root folder
	await Promise.all(appDirNames.map(appDirName => {
		return Promise.all(rootFolders.map(rootFolder => {
			const rootName = rootFolder.split(folderPrefix).pop()
			return symlink(
				join(monorepoRootDirectory, rootFolder),
				join(monorepoRootDirectory, appDirName, 'node_modules', '$', rootName),
				'junction'
			)
		}))
	}))
	// make the node_modules/$/name for each app folder
	await Promise.all(appMapping.map(({ appDirName, linkable, name }) => {
		return symlink(
			join(monorepoRootDirectory, appDirName, linkable),
			join(monorepoRootDirectory, appDirName, 'node_modules', '$', name),
			'junction'
		)
	}))
}

symlinkMonorepo()
    .catch(error => {
		console.error('Failure!', error)
	})
