$('#search').on('input', function () {
  const query = $(this).val();
  $('#bookmarks').empty();
  dumpBookmarks(query);
});

function dumpBookmarks(query) {
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    const groupedBookmarks = groupBookmarksByHostname(bookmarkTreeNodes);
    displayGroupedBookmarks(groupedBookmarks, query, $('#bookmarks'));
  });
}

function groupBookmarksByHostname(bookmarkNodes) {
  const groupedBookmarks = {};
  for (let i = 0; i < bookmarkNodes.length; i++) {
    const bookmarkNode = bookmarkNodes[i];
    if (bookmarkNode.children && bookmarkNode.children.length > 0) {
      const childBookmarks = groupBookmarksByHostname(bookmarkNode.children);
      mergeGroupedBookmarks(groupedBookmarks, childBookmarks);
    }
    if (bookmarkNode.url) {
      const hostname = getHostnameFromUrl(bookmarkNode.url);
      if (!groupedBookmarks[hostname]) {
        groupedBookmarks[hostname] = [];
      }
      groupedBookmarks[hostname].push(bookmarkNode);
    }
  }
  return groupedBookmarks;
}

function mergeGroupedBookmarks(target, source) {
  for (const hostname in source) {
    if (!target[hostname]) {
      target[hostname] = [];
    }
    target[hostname] = target[hostname].concat(source[hostname]);
  }
}

function getHostnameFromUrl(url) {
  const link = document.createElement('a');
  link.href = url;
  return link.hostname;
}

function createBookmarkGroupContainer(hostname) {
  const container = $('<div>').addClass('bookmark-group');
  const title = $('<h3>').text(hostname);
  container.append(title);
  return container;
}

function displayGroupedBookmarks(groupedBookmarks, query, container) {
  for (const hostname in groupedBookmarks) {
    const bookmarkGroup = groupedBookmarks[hostname];
    const groupContainer = createBookmarkGroupContainer(hostname);
    const bookmarksList = $('<ul>');
    for (let i = 0; i < bookmarkGroup.length; i++) {
      const bookmarkNode = bookmarkGroup[i];
      const bookmarkItem = dumpNode(bookmarkNode, query);
      bookmarksList.append(bookmarkItem);
    }
    groupContainer.append(bookmarksList);
    container.append(groupContainer);
  }
}

function dumpNode(bookmarkNode, query) {
  if (!bookmarkNode.title) {
    return $('<span>');
  }
  
  if (query && !bookmarkNode.children) {
    const title = bookmarkNode.title.toLowerCase();
    if (title.indexOf(query.toLowerCase()) === -1) {
      return $('<span>');
    }
  }
  
  const anchor = $('<a>').attr('href', bookmarkNode.url).text(bookmarkNode.title);

  anchor.on('click', function (e) {
    e.preventDefault();
    chrome.tabs.create({ url: bookmarkNode.url });
  });

  const span = $('<span>').append(anchor);
  const li = $('<li>').append(span);

  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    const childList = $('<ul>');
    for (let i = 0; i < bookmarkNode.children.length; i++) {
      const childNode = bookmarkNode.children[i];
      const childItem = dumpNode(childNode, query);
      childList.append(childItem);
    }
    li.append(childList);
  }

  return li;
}

$(document).ready(function () {
  dumpBookmarks();
});
