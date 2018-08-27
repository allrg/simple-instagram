const execSync = require('child_process').execSync;
let fs = require('fs')
var convert = require('xml-js');
let getLayoutXml = async (newPage) => {
  let bootMessage = null
  if (newPage) {
    bootMessage = '⚙️  Aprontando as coisas novamente'
  } else {
    bootMessage = '⚙️  Aprontando as coisas'
  }
  console.log(bootMessage)
  let cmds = ['adb shell uiautomator dump', 'adb pull /sdcard/window_dump.xml .']
  execSync(cmds[0])
  execSync(cmds[1])
}
let click = (at) => {
  let x = at[0]
  let y = at[1]
  execSync(`adb shell input tap ${x} ${y}`)
}
let roll = () => {
  execSync('adb shell input mouse swipe 000 1044 000 464')
}
let parseXmlToJson = () => {

  let parseBounds = (el) => {
    return el.attributes.bounds.split('][').map(item => item.replace(']', '').replace('[', '').split(',').map(item => parseInt(item)))
  }
  let findNode = (resourceId, currentNode, list) => {
    currentNode.elements.forEach(element => {
      if (element.attributes['resource-id'] === resourceId) {
        if (element.attributes.text === 'Seguir')
          list.push(
            {
              username: element.attributes.text,
              description: element.attributes['content-desc'],
              bounds: parseBounds(element)

            }
          )
      }
      return findNode(resourceId, element, list)
    });
  }
  var xml = fs.readFileSync('window_dump.xml', 'utf8');
  var options = { ignoreComment: true, alwaysChildren: true };
  var result = convert.xml2js(xml, options); 
  let followableUsers = []
  result = findNode('com.instagram.android:id/button', result, followableUsers)
  return followableUsers
}
let followProcess = (availableFollowers) => {
  availableFollowers.forEach((item, i) => {
    console.log('\x1b[32m', item.description);
    click(item.bounds[0])
    if (i === availableFollowers.length - 1) {
      reboot(true)
    }
  })
}
let startUp = (newPage = false) => {
  getLayoutXml(newPage)
  console.log('\n🔍 Encontrando seguidores')
  let availableFollowers = parseXmlToJson()
  if (availableFollowers.length > 0) {
    console.log('\n✅ Seguidores encontrados, começando a seguir \n')
    followProcess(availableFollowers)
  } else {
    console.log('\n🚫 Nenhum possível seguidor disponível, tentando de novo \n')
    reboot(false)
  }
}
let reboot = (newPage) => {
  if (newPage) {
    console.log('\x1b[33m', '‍\n\n👮‍ Aguardando para começar novamente para os guardas não nos pegarem')
  }
  console.log('\x1b[0m')
  setTimeout(() => {
    roll()
    console.log('\x1Bc');
    startUp(true)
  }, newPage ? 5000 : 0);
}
startUp()
