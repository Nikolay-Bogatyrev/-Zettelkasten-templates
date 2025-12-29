/**
 * Google Apps Script для генератора карточек Zettelkasten
 * Версия: 2.0
 * Для Николая - работа с HTML шаблоном
 */

// ============= ОСНОВНЫЕ ФУНКЦИИ WEB APP =============

/**
 * Обработчик GET запросов - отображает веб-приложение
 */
function doGet(e) {
  // Проверяем параметры URL
  const params = e.parameter;
  
  // Если есть параметр action=print, сразу открываем для печати
  if (params.action === 'print') {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Zettelkasten Cards - Print')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Обычное отображение
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Zettelkasten Карточки')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Генерирует PDF из текущей страницы
 */
function generatePDF(htmlContent) {
  try {
    // Создаем уникальное имя файла
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `zettelkasten_cards_${timestamp}.pdf`;
    
    // Создаем blob из HTML
    const blob = Utilities.newBlob(htmlContent, 'text/html', 'temp.html');
    
    // Конвертируем в PDF
    const pdfBlob = blob.getAs('application/pdf').setName(fileName);
    
    // Сохраняем в Google Drive
    const folder = getOrCreateFolder('Zettelkasten_Cards');
    const file = folder.createFile(pdfBlob);
    
    // Делаем файл доступным для скачивания
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      fileName: fileName,
      fileId: file.getId(),
      downloadUrl: file.getDownloadUrl(),
      viewUrl: file.getUrl()
    };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Сохраняет HTML как файл в Drive
 */
function saveHTMLFile(htmlContent) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `zettelkasten_template_${timestamp}.html`;
    
    const blob = Utilities.newBlob(htmlContent, 'text/html', fileName);
    const folder = getOrCreateFolder('Zettelkasten_Cards');
    const file = folder.createFile(blob);
    
    return {
      success: true,
      fileName: fileName,
      fileId: file.getId(),
      url: file.getUrl()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Получает или создает папку в Google Drive
 */
function getOrCreateFolder(folderName) {
  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
    // Добавляем описание к папке
    folder.setDescription('Папка для хранения карточек Zettelkasten и шаблонов');
  }
  
  return folder;
}

/**
 * Получает список сохраненных файлов
 */
function getSavedFiles() {
  try {
    const folder = getOrCreateFolder('Zettelkasten_Cards');
    const files = folder.getFiles();
    const fileList = [];
    
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        id: file.getId(),
        name: file.getName(),
        type: file.getMimeType(),
        created: file.getDateCreated().toISOString(),
        size: file.getSize(),
        url: file.getUrl(),
        downloadUrl: file.getDownloadUrl()
      });
    }
    
    // Сортируем по дате создания (новые первые)
    fileList.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return {
      success: true,
      files: fileList
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Удаляет файл
 */
function deleteFile(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    return {
      success: true,
      message: 'Файл перемещен в корзину'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Получает настройки пользователя
 */
function getUserSettings() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = userProperties.getProperty('zettelkasten_settings');
  
  if (settings) {
    return JSON.parse(settings);
  }
  
  // Настройки по умолчанию
  return {
    defaultCategory: 'tech',
    cardsPerPage: 8,
    showInstructions: true,
    autoSave: false,
    categories: {
      tech: {
        name: 'Технические',
        color: '#e3f2fd',
        subcategories: ['Frontend', 'Backend', 'Arch', 'DevOps']
      },
      biz: {
        name: 'Бизнес/Gambling',
        color: '#fff3e0',
        subcategories: ['Mexico', 'Product', 'UX', 'Analytics']
      },
      art: {
        name: 'Искусство',
        color: '#f3e5f5',
        subcategories: ['Живопись', 'Теория', 'История']
      },
      lit: {
        name: 'Литература',
        color: '#e8f5e9',
        subcategories: ['Классика', 'Современ', 'Теория']
      },
      personal: {
        name: 'Личное',
        color: '#fce4ec',
        subcategories: ['Идея', 'Синтез', 'Проект']
      }
    }
  };
}

/**
 * Сохраняет настройки пользователя
 */
function saveUserSettings(settings) {
  try {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('zettelkasten_settings', JSON.stringify(settings));
    
    return {
      success: true,
      message: 'Настройки сохранены'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Экспортирует данные карточек в JSON
 */
function exportCardsData(cardsData) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `zettelkasten_data_${timestamp}.json`;
    
    const blob = Utilities.newBlob(
      JSON.stringify(cardsData, null, 2), 
      'application/json', 
      fileName
    );
    
    const folder = getOrCreateFolder('Zettelkasten_Cards');
    const file = folder.createFile(blob);
    
    return {
      success: true,
      fileName: fileName,
      fileId: file.getId(),
      url: file.getUrl()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Импортирует данные карточек из JSON файла
 */
function importCardsData(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const content = file.getBlob().getDataAsString();
    const data = JSON.parse(content);
    
    return {
      success: true,
      data: data
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Генерирует уникальный ID для карточки
 */
function generateCardId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000);
  
  return `${year}.${month}.${day}.${String(random).padStart(3, '0')}`;
}

/**
 * Создает статистику использования
 */
function getUsageStats() {
  try {
    const folder = getOrCreateFolder('Zettelkasten_Cards');
    const files = folder.getFiles();
    
    let stats = {
      totalFiles: 0,
      pdfFiles: 0,
      htmlFiles: 0,
      jsonFiles: 0,
      totalSize: 0,
      lastCreated: null
    };
    
    while (files.hasNext()) {
      const file = files.next();
      stats.totalFiles++;
      stats.totalSize += file.getSize();
      
      const mimeType = file.getMimeType();
      if (mimeType === 'application/pdf') stats.pdfFiles++;
      if (mimeType === 'text/html') stats.htmlFiles++;
      if (mimeType === 'application/json') stats.jsonFiles++;
      
      const created = file.getDateCreated();
      if (!stats.lastCreated || created > stats.lastCreated) {
        stats.lastCreated = created;
      }
    }
    
    // Форматируем размер
    stats.totalSizeFormatted = formatFileSize(stats.totalSize);
    stats.lastCreatedFormatted = stats.lastCreated ? 
      stats.lastCreated.toLocaleDateString('ru-RU') : 'Нет файлов';
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Форматирует размер файла
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Очищает старые файлы (старше 30 дней)
 */
function cleanOldFiles() {
  try {
    const folder = getOrCreateFolder('Zettelkasten_Cards');
    const files = folder.getFiles();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDateCreated() < thirtyDaysAgo) {
        file.setTrashed(true);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      deletedCount: deletedCount,
      message: `Удалено файлов: ${deletedCount}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Тестовая функция для проверки работы
 */
function test() {
  console.log('Zettelkasten Cards Generator is working!');
  console.log('Current user:', Session.getActiveUser().getEmail());
  console.log('Settings:', getUserSettings());
  return 'OK';
}
