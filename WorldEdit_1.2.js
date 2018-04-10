/**
 * Script Name : WorldEdit
 * Maker : Irenebode (kth020315@naver.com)
 * Idea : ToonRaon
 * WorldEdit API : ToonRaon, Pandong
 * Tool : Quoda(Mobile), Atom(PC)
 * GitHub : https://github.com/taehoon02/ModPE_WorldEdit
 *
 * The script is in Korean.
 * Secondary modifications are possible but secondary sharing is not possible.
 * Thank all those who have helped me.
 * Copyright (C) 2017-2018 Irenebode All rights reserved.
 */


/**
 * Some variables and constants declaration
 */

// context Set
const ctx = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();


// GitHub Url Set
const VERSION_CHECK_URL = "https://raw.githubusercontent.com/taehoon02/ModPE_WorldEdit/master/ScriptInfo.txt";
const GITHUB_API_TREE_URL = "https://raw.githubusercontent.com/taehoon02/ModPE_WorldEdit/master/github_api_tree.txt";


// Derectory Set
const SD_CARD = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();
const RESOURCE_PATH = SD_CARD + "/games/com.mojang/worldedit/";
const IMAGE_PATH = RESOURCE_PATH + "/images";
const GUI_PATH = IMAGE_PATH + "/gui";
const ITEM_PATH = IMAGE_PATH + "/block";
const FONT_PATH = RESOURCE_PATH + "/fonts";
const NANUM_SQUARE_ROUND_L = FONT_PATH + "/NanumSquareRoundL.ttf";
const FILE_DATA = java.io.File(RESOURCE_PATH, "worldedit_options.txt");


// Script Info
const info = {
  name: "WorldEdit",
  version: "1.2",
  maker: "Irenebode"
};


// Color Set
const colors = ["#EEEEEE", "#0F9D58"];


// Popup Windows
var windows = {
  mainWindow: null,
  main: null,
  cmd: null,
  progressWindow: null,
  toolWindow: null,
  cmdWindow: null,
  undoWindow: null,
  redoWindow: null,
  contiWindow: null,
  imageViewerWindow: null
};


// mainMenuL Toggle
var posNow = false;
var focusInfo = false;
var itemInfo = false;
var blockInfo = false;
var quickRemove = false;
var quickChange = false;
var footBlock = false;
var headBlock = false;
var upBlock = false;
var Height = 0;
var downBlock = false;
var Down = 0;
var signChange = false;


// Layout Margin
var margin = new android.view.ViewGroup.MarginLayoutParams(-1, 100);
margin.setMargins(6, 3, 6, 3);


// WorldEdit variables and contants and functions
var checkFilesThread;
var makeGUIWindowThread;

var GUIWindow;

var selectedCommand, selectedItemId, selectedItemData;

var blockId, blockData, block2Id, block2Data;
var radiusNum, heightNum, degreeNum;

var clipboard;
var stackClipboard;

var contiBtn;
var savedCommand;
var savedItemId;
var savedItemData;
var continueCommand;

var minPoint = {
  x: null,
  y: null,
  z: null
};
var maxPoint = {
  x: null,
  y: null,
  z: null
};

var commandDetector = false;

var worldEditMemory = {
  pos1: [null, null, null],
  pos2: [null, null, null],
  blockSave: new Array(),
  lastWorkSavings: {
    changedBlocks: new Array()
  },
  lastUndoSavings: {
    changedBlocks: new Array()
  }
}


function getStartPos(pos1, pos2) {
  var pos3 = [];
  if (pos1[0] <= pos2[0]) {
    pos3.push(pos1[0]);
  } else {
    pos3.push(pos2[0]);
  }
  if (pos1[1] <= pos2[1]) {
    pos3.push(pos1[1]);
  } else {
    pos3.push(pos2[1]);
  }
  if (pos1[2] <= pos2[2]) {
    pos3.push(pos1[2]);
  } else {
    pos3.push(pos2[2]);
  }
  return pos3;
}


function getDist(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1[0] - pos2[0], 2) + Math.pow(pos1[1] - pos2[1], 2) + Math.pow(pos1[2] - pos2[2], 2));
}


function comparePoint(type) {
  try {
    var point = {
      x: null,
      y: null,
      z: null
    };

    if (type == 0) { //min
      var x = Math.min(worldEditMemory.pos1[0], worldEditMemory.pos2[0]);
      var y = Math.min(worldEditMemory.pos1[1], worldEditMemory.pos2[1]);
      var z = Math.min(worldEditMemory.pos1[2], worldEditMemory.pos2[2]);

      point.x = x;
      point.y = y;
      point.z = z;

      return point;
    } else if (type == 1) { //max
      var x = Math.max(worldEditMemory.pos1[0], worldEditMemory.pos2[0]);
      var y = Math.max(worldEditMemory.pos1[1], worldEditMemory.pos2[1]);
      var z = Math.max(worldEditMemory.pos1[2], worldEditMemory.pos2[2]);

      point.x = x;
      point.y = y;
      point.z = z;

      return point;
    }
  } catch (e) {
    toast("두 지점을 비교하는 과정에서 오류가 발생했습니다.");
  }
}


var worldEditCmds = [{
  // 복사 0
  func: function(minPoint, maxPoint) {
    var length = {
      x: (maxPoint.x - minPoint.x + 1),
      y: (maxPoint.y - minPoint.y + 1),
      z: (maxPoint.z - minPoint.z + 1)
    };

    var count = 0;

    clipboard = new Array(length.x);
    for (var i = 0; i < length.x; i++) {
      clipboard[i] = new Array(length.y);

      for (var j = 0; j < length.y; j++) {
        clipboard[i][j] = new Array(length.z);

        for (var k = 0; k < length.z; k++) {
          clipboard[i][j][k] = {
            id: Level.getTile(minPoint.x + i, minPoint.y + j, minPoint.z + k),
            data: Level.getData(minPoint.x + i, minPoint.y + j, minPoint.z + k)
          };
          count++;
        }
      }
    }

    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블럭이 성공적으로 복사되었습니다.");
  }
}, {
  // 붙여넣기 1
  func: function() {
    if (clipboard == null) {
      toast("클립보드에 저장된 블럭이 없습니다.");
      return;
    }

    var x = Math.floor(Player.getX());
    var y = Math.floor(Player.getY() - 1);
    var z = Math.floor(Player.getZ());

    var yaw = Entity.getYaw(Player.getEntity());
    var sin = Math.round(Math.sin(yaw * (Math.PI / 180)));
    var cos = Math.round(Math.cos(yaw * (Math.PI / 180)));

    if (sin == 1)
      x = x - clipboard.length + 1;
    if (cos == -1)
      z = z - clipboard[0][0].length + 1;

    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var count = 0;
    for (var i = 0; i < clipboard.length; i++) {
      for (var j = 0; j < clipboard[0].length; j++) {
        for (var k = 0; k < clipboard[0][0].length; k++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([x + i, y + j, z + k, Level.getTile(x + i, y + j, z + k), Level.getData(x + i, y + j, z + k)]);
          Level.setTile(x + i, y + j, z + k, clipboard[i][j][k].id, clipboard[i][j][k].data);
          count++;
        }
      }
    }

    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블럭이 성공적으로 붙여넣어졌습니다.");

    preventFolding();
  }
}, {
  // 채우기 2
  func: function(pos1, pos2, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
          setTile(x, y, z, blockId, blockData);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();

    var chunk_x = parseInt((pos2[0] - pos1[0]) / 16),
      chunk_z = parseInt((pos2[2] - pos1[2]) / 16);
    if (chunk_x >= 4 || chunk_z >= 4) clientMessage(ChatColor.RED + "[경고!] 넓은 영역을 에딧하여 청크 오류로 맵 저장이 되지 않을 수도 있습니다.");
  }
}, {
  // 비우기 3
  func: function(pos1, pos2) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
          setTile(x, y, z, 0, 0);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 제거하였습니다.");
  }
}, {
  // 바꾸기 4
  func: function(pos1, pos2, blockId, blockData, block2Id, block2Data) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Level.getTile(x, y, z) == blockId && Level.getData(x, y, z) == blockData) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, block2Id, block2Data);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록이 성공적으로 바꼈습니다.");
  }
}, {
  // 남기기 5
  func: function(pos1, pos2, blockId, blockData, block2Id, block2Data) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Level.getTile(x, y, z) != blockId && Level.getData(x, y, z) != blockData) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, block2Id, block2Data);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록이 성공적으로 바꼈습니다.");
  }
}, {
  // 벽 6
  func: function(pos1, pos2, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (x == startPos[0] || x == startPos[0] + width - 1 || z == startPos[2] || z == startPos[2] + length - 1) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 원 7
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var pos1 = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var startPos = [pos1[0] - radious, pos1[1], pos1[2] - radious];
    var width = radious * 2 + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var z = startPos[2]; z < startPos[2] + length; z++) {
        if (Math.floor(getDist(pos1, [x, startPos[1], z])) <= radious) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([x, startPos[1], z, Level.getTile(x, startPos[1], z), Level.getData(x, startPos[1], z)]);
          setTile(x, startPos[1], z, blockId, blockData);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 빈원 8
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var z = startPos[2]; z < startPos[2] + length; z++) {
        if (Math.floor(getDist(playerPos, [x, startPos[1], z])) == radious) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([x, startPos[1], z, Level.getTile(x, startPos[1], z), Level.getData(x, startPos[1], z)]);
          setTile(x, startPos[1], z, blockId, blockData);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");
  }
}, {
  // 구 9
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1) - radious, Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var height = radious * 2 + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist(playerPos, [x, y, z])) <= radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 반구 10
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var height = radious + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist(playerPos, [x, y, z])) <= radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 빈구 11
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1) - radious, Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var height = radious * 2 + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist(playerPos, [x, y, z])) == radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");
  }
}, {
  // 빈반구 12
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var height = radious + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist(playerPos, [x, y, z])) == radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");
  }
}, {
  // 역반구 13
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var height = radious + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y > startPos[1] - height; y--) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist(playerPos, [x, y, z])) <= radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 역빈반구 14
  func: function(radious, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var height = radious + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y > startPos[1] - height; y--) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist(playerPos, [x, y, z])) == radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");
  }
}, {
  // 원기둥 15
  func: function(radious, height, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist([playerPos[0], y, playerPos[2]], [x, y, z])) <= radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 빈원기둥 16
  func: function(radious, height, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()) - radious, Math.floor(Player.getY() - 1), Math.floor(Player.getZ()) - radious];
    var playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1), Math.floor(Player.getZ())];
    var width = radious * 2 + 1;
    var length = radious * 2 + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          if (Math.floor(getDist([playerPos[0], y, playerPos[2]], [x, y, z])) == radious) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");
  }
}, {
  // 피라미드 17
  func: function(height, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1) + height - 1, Math.floor(Player.getZ())];
    var layer = 0;
    for (var y = startPos[1]; y > startPos[1] - height; y--) {
      layer++;
      for (var x = startPos[0] - layer + 1; x < startPos[0] + layer; x++) {
        for (var z = startPos[2] - layer + 1; z < startPos[2] + layer; z++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
          setTile(x, y, z, blockId, blockData);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");

    preventFolding();
  }
}, {
  // 빈피라미드 18
  func: function(height, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = [Math.floor(Player.getX()), Math.floor(Player.getY() - 1) + height - 1, Math.floor(Player.getZ())];
    var layer = 0;
    for (var y = startPos[1]; y > startPos[1] - height; y--) {
      layer++;
      for (var x = startPos[0] - layer + 1; x < startPos[0] + layer; x++) {
        for (var z = startPos[2] - layer + 1; z < startPos[2] + layer; z++) {
          if (x == startPos[0] - layer + 1 || x == startPos[0] + layer - 1 || z == startPos[2] - layer + 1 || z == startPos[2] + layer - 1) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 생성하였습니다.");
  }
}, {
  // 위로 이동 19
  func: function(height) {
    Level.setTile(Math.floor(Player.getX()), Math.floor(Player.getY()) + height, Math.floor(Player.getZ()), 20);
    Entity.setPosition(Player.getEntity(), Math.floor(Player.getX()), Math.floor(Player.getY()) + height + 5, Math.floor(Player.getZ()));
    clientMessage(ChatColor.GREEN + height + "만큼 위로 이동하였습니다.");
  }
}, {
  // 덮기 20
  func: function(pos1, pos2, blockId, blockData) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var z = startPos[2]; z < startPos[2] + length; z++) {
        for (var y = startPos[1]; y < startPos[1] + height; y++) {
          var block = Level.getTile(x, y, z);
          var topBlock = Level.getTile(x, y + 1, z);
          if (block != 0 && topBlock == 0) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, ++y, z, blockId, blockData);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블럭을 성공적으로 덮었습니다.");

    preventFolding();
  }
}, {
  // 회전 90, 180, 270도 21
  func: function(degree, init) {
    if (clipboard == null) {
      clientMessage(ChatColor.RED + "먼저 영역을 복사해주세요.");
      return;
    }

    if (degree % 90 != 0 || degree >= 360 || degree <= 0) {
      clientMessage(ChatColor.RED + "회전각도는 90, 180, 270 중 하나이여야 합니다.");
      return;
    }

    var tempArray = new Array(clipboard[0][0].length);
    for (var i = 0; i < tempArray.length; i++) {
      tempArray[i] = new Array(clipboard[0].length);
      for (var j = 0; j < tempArray[0].length; j++) {
        tempArray[i][j] = new Array(clipboard.length);
        for (var k = 0; k < tempArray[0][0].length; k++)
          tempArray[i][j][k] = 0;
      }
    }

    for (var i = 0; i < clipboard.length; i++) {
      for (var j = 0; j < clipboard[0].length; j++) {
        for (var k = 0; k < clipboard[0][0].length; k++) {
          var x = i,
            y = j,
            z = k;
          var _x = -z,
            _y = y,
            _z = x; //각 Θ = pi/2일 때 회전변환
          _x += clipboard[0][0].length - 1; //제 2사분면을 제 1사분면으로 평행이동
          tempArray[_x][_y][_z] = clipboard[x][y][z];
        }
      }
    }

    clipboard = tempArray;

    //degree가 90이 아니면 90이 될 때까지 계속 돌림
    if (degree != 90) {
      worldEditCmds[21].func(degree - 90, degree);
      return;
    }

    if (degreeNum == 90) toast("90도 회전하였습니다.");
    else if (degreeNum == 180) toast("180도 회전하였습니다.");
    else if (degreeNum == 270) toast("270도 회전하였습니다.");
  }
}, {
  // Y축 대칭 22
  func: function(pos1, pos2) {
    var sx = (pos1[0] < pos2[0] ? pos1[0] : pos2[0]);
    var sy = (pos1[1] < pos2[1] ? pos1[1] : pos2[1]);
    var sz = (pos1[2] < pos2[2] ? pos1[2] : pos2[2]);

    var ex = (pos1[0] > pos2[0] ? pos1[0] : pos2[0]);
    var ey = (pos1[1] > pos2[1] ? pos1[1] : pos2[1]);
    var ez = (pos1[2] > pos2[2] ? pos1[2] : pos2[2]);

    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var count = 0;
    var flip = [];

    for (var x = 0; x < ex - sx + 1; x++) {
      flip[x] = [];
      for (var y = 0; y < ey - sy + 1; y++) {
        flip[x][y] = [];
        for (var z = 0; z < ez - sz + 1; z++) {
          flip[x][y][z] = {
            id: Level.getTile(sx + x, sy + y, sz + z),
            data: Level.getData(sx + x, sy + y, sz + z)
          };
        }
      }
    }

    for (var xx = 0; xx < flip.length; xx++) {
      for (var yy = 0; yy < flip[0].length; yy++) {
        for (var zz = 0; zz < flip[0][0].length; zz++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([sx + xx, flip[0].length - 1 - yy + sy, sz + zz, Level.getTile(sx + xx, flip[0].length - 1 - yy + sy, sz + zz), Level.getData(sx + xx, flip[0].length - 1 - yy + sy, sz + zz)]);
          setTile(sx + xx, flip[0].length - 1 - yy + sy, sz + zz, flip[xx][yy][zz].id, flip[xx][yy][zz].data);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블럭을 Y축 대칭하였습니다.");
  }
}, {
  // 흡수 23
  func: function(pos1, pos2) {
    var count = 0;
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var startPos = getStartPos(pos1, pos2);
    var width = Math.abs(pos1[0] - pos2[0]) + 1;
    var height = Math.abs(pos1[1] - pos2[1]) + 1;
    var length = Math.abs(pos1[2] - pos2[2]) + 1;
    for (var x = startPos[0]; x < startPos[0] + width; x++) {
      for (var y = startPos[1]; y < startPos[1] + height; y++) {
        for (var z = startPos[2]; z < startPos[2] + length; z++) {
          var block = Level.getTile(x, y, z);
          if (block == 8 || block == 9 || block == 10 || block == 11) {
            worldEditMemory.lastWorkSavings.changedBlocks.push([x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z)]);
            setTile(x, y, z, 0, 0);
            count++;
          }
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블록을 성공적으로 흡수하였습니다.");
  }
}, {
  // 되돌리기 24
  func: function() {
    var changedBlocks = worldEditMemory.lastWorkSavings.changedBlocks;
    var changedBlocksLength = changedBlocks.length;
    if (!changedBlocksLength) return;
    var count = 0;
    for (var i = 0; i < changedBlocksLength; i++) {
      worldEditMemory.lastUndoSavings.changedBlocks.push([changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2], Level.getTile(changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2]), Level.getData(changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2])]);
      setTile(changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2], changedBlocks[i][3], changedBlocks[i][4]);
      count++;
    }
    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    clientMessage(ChatColor.GREEN + count + "개의 블럭이 복원되었습니다.");
  }
}, {
  // 다시실행 25
  func: function() {
    var changedBlocks = worldEditMemory.lastUndoSavings.changedBlocks;
    var changedBlocksLength = changedBlocks.length;
    if (!changedBlocksLength) return;
    var count = 0;
    for (var i = 0; i < changedBlocksLength; i++) {
      worldEditMemory.lastWorkSavings.changedBlocks.push([changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2], Level.getTile(changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2]), Level.getData(changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2])]);
      setTile(changedBlocks[i][0], changedBlocks[i][1], changedBlocks[i][2], changedBlocks[i][3], changedBlocks[i][4]);
      count++;
    }
    worldEditMemory.lastUndoSavings.changedBlocks = new Array();
    clientMessage(ChatColor.GREEN + count + "개의 블럭이 복원되었습니다.");
  }
}, {
  // 쌓기 26 (색유리를 제외한 다른 블럭으로 실행 시 팅김. 원인 불명)
  func: function(minPoint, maxPoint, height) {
    try {
      var length = {
        x: (maxPoint.x - minPoint.x + 1),
        y: (maxPoint.y - minPoint.y + 1),
        z: (maxPoint.z - minPoint.z + 1)
      };

      stackClipboard = new Array(length.x);
      for (var i = 0; i < length.x; i++) {
        stackClipboard[i] = new Array(length.y);

        for (var j = 0; j < length.y; j++) {
          stackClipboard[i][j] = new Array(length.z);

          for (var k = 0; k < length.z; k++) {
            stackClipboard[i][j][k] = {
              id: Level.getTile(minPoint.x + i, minPoint.y + j, minPoint.z + k),
              data: Level.getData(minPoint.x + i, minPoint.y + j, minPoint.z + k)
            };
          }
        }
      }

      var x = minPoint.x;
      var y = minPoint.y;
      var z = minPoint.z;

      worldEditMemory.lastWorkSavings.changedBlocks = new Array();
      var count = 0;
      for (var h = 0; h < height; h++) {
        for (var i = 0; i < stackClipboard.length; i++) {
          for (var j = 0; j < stackClipboard[0].length; j++) {
            for (var k = 0; k < stackClipboard[0][0].length; k++) {
              worldEditMemory.lastWorkSavings.changedBlocks.push([x + i, y + j + h, z + k, Level.getTile(x + i, y + j + h, z + k), Level.getData(x + i, y + j + h, z + k)]);
              Level.setTile(x + i, y + j + h, z + k, stackClipboard[i][j][k].id, stackClipboard[i][j][k].data);
              count++;
            }
          }
        }
      }

      clientMessage(ChatColor.GREEN + "성공적으로 " + height + "만큼 쌓아올렸습니다.");

      preventFolding();
    } catch (e) {
      clientMessage(e + ", " + e.lineNumber);
    }
  }
}, {
  // X축 대칭 27
  func: function(pos1, pos2) {
    var sx = (pos1[0] < pos2[0] ? pos1[0] : pos2[0]);
    var sy = (pos1[1] < pos2[1] ? pos1[1] : pos2[1]);
    var sz = (pos1[2] < pos2[2] ? pos1[2] : pos2[2]);

    var ex = (pos1[0] > pos2[0] ? pos1[0] : pos2[0]);
    var ey = (pos1[1] > pos2[1] ? pos1[1] : pos2[1]);
    var ez = (pos1[2] > pos2[2] ? pos1[2] : pos2[2]);

    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var count = 0;
    var flip = [];

    for (var x = 0; x < ex - sx + 1; x++) {
      flip[x] = [];
      for (var y = 0; y < ey - sy + 1; y++) {
        flip[x][y] = [];
        for (var z = 0; z < ez - sz + 1; z++) {
          flip[x][y][z] = {
            id: Level.getTile(sx + x, sy + y, sz + z),
            data: Level.getData(sx + x, sy + y, sz + z)
          };
        }
      }
    }

    for (var xx = 0; xx < flip.length; xx++) {
      for (var yy = 0; yy < flip[0].length; yy++) {
        for (var zz = 0; zz < flip[0][0].length; zz++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([flip.length - 1 - xx + sx, sy + yy, sz + zz, Level.getTile(flip.length - 1 - xx + sx, sy + yy, sz + zz), Level.getData(flip.length - 1 - xx + sx, sy + yy, sz + zz)]);
          setTile(flip.length - 1 - xx + sx, sy + yy, sz + zz, flip[xx][yy][zz].id, flip[xx][yy][zz].data);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블럭을 X축 대칭하였습니다.");
  }
}, {
  // Z축 대칭 28
  func: function(pos1, pos2) {
    var sx = (pos1[0] < pos2[0] ? pos1[0] : pos2[0]);
    var sy = (pos1[1] < pos2[1] ? pos1[1] : pos2[1]);
    var sz = (pos1[2] < pos2[2] ? pos1[2] : pos2[2]);

    var ex = (pos1[0] > pos2[0] ? pos1[0] : pos2[0]);
    var ey = (pos1[1] > pos2[1] ? pos1[1] : pos2[1]);
    var ez = (pos1[2] > pos2[2] ? pos1[2] : pos2[2]);

    worldEditMemory.lastWorkSavings.changedBlocks = new Array();
    var count = 0;
    var flip = [];

    for (var x = 0; x < ex - sx + 1; x++) {
      flip[x] = [];
      for (var y = 0; y < ey - sy + 1; y++) {
        flip[x][y] = [];
        for (var z = 0; z < ez - sz + 1; z++) {
          flip[x][y][z] = {
            id: Level.getTile(sx + x, sy + y, sz + z),
            data: Level.getData(sx + x, sy + y, sz + z)
          };
        }
      }
    }

    for (var xx = 0; xx < flip.length; xx++) {
      for (var yy = 0; yy < flip[0].length; yy++) {
        for (var zz = 0; zz < flip[0][0].length; zz++) {
          worldEditMemory.lastWorkSavings.changedBlocks.push([sx + xx, sy + yy, flip[0][0].length - 1 - zz + sz, Level.getTile(sx + xx, sy + yy, flip[0][0].length - 1 - zz + sz), Level.getData(sx + xx, sy + yy, flip[0][0].length - 1 - zz + sz)]);
          setTile(sx + xx, sy + yy, flip[0][0].length - 1 - zz + sz, flip[xx][yy][zz].id, flip[xx][yy][zz].data);
          count++;
        }
      }
    }
    clientMessage(ChatColor.GREEN + "총 " + count + "개의 블럭을 Z축 대칭하였습니다.");
  }
}];


var progressDialog;

function progressShow(msg) {
  ctx.runOnUiThread(new java.lang.Runnable() {
    run: function() {
      progressDialog = android.app.ProgressDialog.show(ctx, msg, "잠시만 기다려주세요...", true, false);
    }
  });
}


function progressDismiss() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        progressDialog.dismiss();
        progressDialog = null;
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


function preventFolding() {
  var ent = Player.getEntity();
  var x = Player.getX();
  var y = Player.getY();
  var z = Player.getZ();

  while (Level.getTile(x, y - 1, z) != 0 || Level.getTile(x, y, z) != 0) Entity.setPosition(ent, x, ++y, z);
}


function radiusSetDialog() {
  var dialog;

  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        radiusNum = null;

        var editText = new android.widget.EditText(ctx);
        editText.setHint("반지름을 입력하세요..");
        editText.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        dialog = new android.app.AlertDialog.Builder(ctx, 5);
        dialog.setTitle("반지름 설정");
        dialog.setView(editText);
        dialog.setNegativeButton("취소", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            if (editText.getText() + "" == "") {
              toast("반지름이 설정되지않았습니다.");
              closeWindow(GUIWindow);
              return;
            }
            radiusNum = parseInt(editText.getText() + "");
            toast("반지름을 " + radiusNum + "으로 설정하였습니다.");
          }
        }));
        dialog.setCancelable(false);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
  return dialog;
}


function heightSetDialog() {
  var dialog;

  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        heightNum = null;

        var editText = new android.widget.EditText(ctx);
        editText.setHint("높이를 입력하세요..");
        editText.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        dialog = new android.app.AlertDialog.Builder(ctx, 5);
        dialog.setTitle("높이 설정");
        dialog.setView(editText);
        dialog.setNegativeButton("취소", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            if (editText.getText() + "" == "") {
              toast("높이가 설정되지않았습니다.");
              closeWindow(GUIWindow);
              return;
            }
            heightNum = parseInt(editText.getText() + "");
            toast("높이를 " + heightNum + "으로 설정하였습니다.");
          }
        }));
        dialog.setCancelable(false);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
  return dialog;
}


/**
 * Some functions declaration
 */

/**
 * dip2px
 */
function dip2px(dips) {
  return parseInt(dips * ctx.getResources().getDisplayMetrics().density + 0.5);
}


/*
 * (save/read/remove)Data
 * Thanks ToonRaon
 * Since 171228
 */
function saveData(name, content) {
  var file = FILE_DATA;

  var fileInputStream = new java.io.FileInputStream(file);
  var inputStreamReader = new java.io.InputStreamReader(fileInputStream);
  var bufferedReader = new java.io.BufferedReader(inputStreamReader);

  var savedContent = "";
  while (true) {
    var str = bufferedReader.readLine();

    if (str == null) break;
    str += ""; //자바 -> 자바스크립트 문자열 형변환
    if (str.split("|")[0] == name) continue; //이미 밸류가 저장된 경우 넘김

    savedContent += str + "\n";
  }

  fileInputStream.close();
  inputStreamReader.close();
  bufferedReader.close();

  var fileOutputStream = new java.io.FileOutputStream(file);
  var outputStreamWriter = new java.io.OutputStreamWriter(fileOutputStream);

  outputStreamWriter.write(savedContent + name.toString() + "|" + content.toString()); //새로운 데이터 덧붙여 저장

  outputStreamWriter.close();
  fileOutputStream.close();
}


function readData(name) {
  var file = FILE_DATA;

  var fileInputStream = new java.io.FileInputStream(file);
  var inputStreamReader = new java.io.InputStreamReader(fileInputStream);
  var bufferedReader = new java.io.BufferedReader(inputStreamReader);

  var string = "";
  while (true) {
    var str = bufferedReader.readLine();
    if (str == null) break;
    str += ""; //자바 -> 자바스크립트 문자열 형변환

    if (str.split("|")[0] == name) {
      string = str.split("|")[1];
      break;
    }
  }

  fileInputStream.close();
  inputStreamReader.close();
  bufferedReader.close();

  return string;
}


function removeData(name) {
  var file = FILE_DATA;

  var fileInputStream = new java.io.FileInputStream(file);
  var inputStreamReader = new java.io.InputStreamReader(fileInputStream);
  var bufferedReader = new java.io.BufferedReader(inputStreamReader);

  var savedContent = "";
  while (true) {
    var str = bufferedReader.readLine();

    if (str == null) break;
    str += ""; //자바 -> 자바스크립트 문자열 형변환
    if (str.split("|")[0] == name) continue; //이미 밸류가 저장된 경우 넘김

    savedContent += str + "\n";
  }

  fileInputStream.close();
  inputStreamReader.close();
  bufferedReader.close();

  var fileOutputStream = new java.io.FileOutputStream(file);
  var outputStreamWriter = new java.io.OutputStreamWriter(fileOutputStream);

  outputStreamWriter.write(savedContent);

  outputStreamWriter.close();
  fileOutputStream.close();
}


/**
 * setDragable (set btn location)
 * Made by Irenebode
 * Since 180102
 */
function setDragable(window, view, dataX, dataY, type) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      var vx;
      var vy;
      var sx;
      var sy;
      var longCheck = false;

      try {
        view.setOnLongClickListener(new android.view.View.OnLongClickListener({
          onLongClick: function(v) {
            try {
              longCheck = true;
              return true;
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));

        view.setOnTouchListener(new android.view.View.OnTouchListener({
          onTouch: function(v, event) {
            switch (event.action) {
              case android.view.MotionEvent.ACTION_DOWN:
                vx = event.getX();
                vy = event.getY();
                break;
              case android.view.MotionEvent.ACTION_MOVE:
                if (longCheck) {
                  sx = event.getRawX();
                  sy = event.getRawY();

                  x = type == 0 ? (sx - vx) : ctx.getWindowManager().getDefaultDisplay().getWidth() - (sx + (v.getWidth() - vx));
                  y = (sy - vy);
                  window.update(x, y, -2, -2, true);
                }
                break;
              case android.view.MotionEvent.ACTION_UP:
                if (longCheck) {
                  longCheck = false;
                  saveData(dataX, x);
                  saveData(dataY, y);
                }
                break;
            }
            return false;
          }
        }));
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * ResourceFile Downloader
 * Made by Irenebode
 * Thanks ToonRaon
 * Since 171214
 */
var isScriptable = false;

function checkDirectories() {
  try {

    // 최상위 리소스 폴더
    var resourceDir = new java.io.File(RESOURCE_PATH);
    if (!resourceDir.exists()) resourceDir.mkdirs();

    // 이미지 리소스 폴더
    var imageDir = new java.io.File(IMAGE_PATH);
    if (!imageDir.exists()) imageDir.mkdirs();

    // GUI 리소스 폴더
    var GUIDir = new java.io.File(GUI_PATH);
    if (!GUIDir.exists()) GUIDir.mkdirs();

    // 아이템 리소스 폴더
    var itemDir = new java.io.File(ITEM_PATH);
    if (!itemDir.exists()) itemDir.mkdirs();

    // 폰트 폴더
    var fontDir = new java.io.File(FONT_PATH);
    if (!fontDir.exists()) fontDir.mkdirs();

    // 옵션 파일
    if (!FILE_DATA.exists()) FILE_DATA.createNewFile();
  } catch (e) {
    toast("리소스 폴더를 생성하는 과정에서 오류가 발생했습니다.");
  }
}


function checkFiles() {
  if (isScriptable) return;
  try {
    var resourceLocalFilesList = getFilesListFromLocal(RESOURCE_PATH, true); // 로컬의 파일 리스트

    var isDownloadAllowed = false;
    var threadFreezer = false;

    if (!checkInternet()) {
      if (resourceLocalFilesList.length == 0) { // 로컬 저장소에 파일이 아무 것도 존재하지 않음
        isDownloadAllowed = false;
        isScriptable = false;
        threadFreezer = false;

        alertDialog("월드에딧 스크립트 실행 불가능",
          "인터넷에 연결되어 있지 않으며\n" +
          "현재 귀하의 휴대폰에 저장된 리소스 파일이 하나도 존재하지 않습니다.\n" +
          "\n" +
          "리소스 파일을 다운로드 받지 않고는\n" +
          "월드에딧 스크립트를 사용할 수 없습니다." +
          "\n" +
          "인터넷에 연결을 하신 뒤 다시 스크립트를 적용해주세요." +
          "(와이파이 권장)"
        );

        return;
      } else if (resourceLocalFilesList.length > 0) { // 로컬 저장소에 파일이 있긴 있음
        toast("인터넷에 연결되어 있지 않아 서버에 접속이 불가능합니다. 가급적 인터넷에 연결 후 사용해주세요.(와이파이 권장)");

        isDownloadAllowed = false;
        isScriptable = false;
        threadFreezer = false;

        return;
      }
    }

    // 파일 다운로드 다이얼로그
    var listener = new android.content.DialogInterface.OnClickListener({
      onClick: function(dialog, which) {
        switch (which) {
          case android.content.DialogInterface.BUTTON_POSITIVE:
            if (checkInternet()) {
              isDownloadAllowed = true;
              threadFreezer = false;
            } else {
              alertDialog("네트워크 연결 오류!", "현재 네트워크에 연결되어있지 않아 파일을 다운로드 할 수 없습니다.\n네트워크 연결 상태를 다시 확인한 후 시도해주세요.\n파일을 다운로드하지않으면 스크립트 사용이 불가능합니다.", null, "확인", null, null);

              isDownloadAllowed = false;
              isScriptable = false;
              threadFreezer = false;
            }
            break;

          case android.content.DialogInterface.BUTTON_NEGATIVE:
            isDownloadAllowed = false;
            isScriptable = false;
            threadFreezer = false;

            toast("파일 다운로드가 거부되었습니다.\n" + "월드에딧 스크립트 사용이 불가능합니다.");
            break;
        }
      }
    });

    // 누락파일 발견 다이얼로그
    var missingFileDialog = new android.app.AlertDialog.Builder(ctx, 5);
    missingFileDialog.setTitle("누락된 파일이 존재합니다.");
    missingFileDialog.setMessage("다운로드 되지 않은 리소스 파일(이미지나 소리 파일 등)이 발견되었습니다.\n" +
      "월드에딧 스크립트는 많은 양의 리소스 파일에 의존하고 있습니다.\n" +
      "따라서 리소스 파일이 없을 경우에 스크립트 사용이 불가능합니다.\n\n" +
      "리소스 파일을 다운로드 받으시겠습니까?\n" +
      "3G 혹은 4G로 인터넷에 연결한 경우\n" +
      "리소스 파일 다운로드할 시 사용 요금제에 따라\n" +
      "요금이 부과될 수 있습니다.\n\n" +
      "파일을 다운로드하시겠습니까?(와이파이 권장)"
    );
    missingFileDialog.setPositiveButton("설치", listener);
    missingFileDialog.setNegativeButton("취소", listener);
    missingFileDialog.setCancelable(false);

    var resourceFilesList = getFilesListFromGitHub("res", true, GITHUB_API_TREE_URL); // 서버의 파일 리스트

    var missingFilesList = new Array(); // 누락된 파일 리스트
    var missingFilesTotalSize = 0;

    checkFilesThread = new java.lang.Thread(new java.lang.Runnable() {
      run: function() {
        try {
          for (var i in resourceFilesList) {
            // 로컬 저장소의 파일 중 name이 같은 것이 있는지를 찾아냄
            if (resourceLocalFilesNameList.indexOf(resourceFilesList[i].name) == -1) { // 로컬에 파일 없을 때
              var fileInfo = {
                "name": resourceFilesList[i].name,
                "download_url": "https://raw.githubusercontent.com/taehoon02/ModPE_WorldEdit/master/" + resourceFilesList[i].path,
                "local_path": (RESOURCE_PATH + resourceFilesList[i].path.replace("res", "")),
                "size": resourceFilesList[i].size
              };

              missingFilesList.push(fileInfo);
            }
          }

          if (missingFilesList.length == 0) { // 모든 파일 존재
            isScriptable = true;
          } else if (missingFilesList.length > 0) { // 누락 파일이 존재
            // 다운로드 의사 묻기
            ctx.runOnUiThread(new java.lang.Runnable() {
              run: function() {
                missingFileDialog.show();
              }
            });

            threadFreezer = true;
            // 다운로드 의사 결정하기 전까지 프리징
            freezer = new java.lang.Thread(new java.lang.Runnable() {
              run: function() {
                while (threadFreezer) {
                  java.lang.Thread.sleep(1);
                }
              }
            });
            freezer.start();
            freezer.join();

            // 사용자로부터 응답(다이얼로그 버튼 선택)을 받은 후 실행
            if (isDownloadAllowed) { // 다운로드 허락
              // 리소스 파일 다운로드 알림 다이얼로그
              var progressDialog;
              ctx.runOnUiThread(new java.lang.Runnable() {
                run: function() {
                  progressDialog = android.app.ProgressDialog.show(ctx, "리소스 파일 다운로드 중", "잠시만 기다려주세요...", true, false);
                }
              });

              // 상단바 보여줌
              showStatusBar();

              for (var i in missingFilesList) {
                // 파일 다운로드
                var currentProgress = i;
                var totalProgress = missingFilesList.length;

                var missingFile = new java.io.File(missingFilesList[i].local_path);

                // 프로그래스 다이얼로그 표시
                ctx.runOnUiThread(new java.lang.Runnable() {
                  run: function() {
                    var progressString = "상단바에 현재 파일의 다운로드 진행률을 보여줍니다.\n도중에 홈키를 누른다거나 전원을 끄지 마세요.\n전체 진행률: " + (currentProgress / totalProgress * 100).toFixed(2) + "% ( " + currentProgress + " / " + totalProgress + " )" + "\n다운로드 중인 파일: " + missingFilesList[i].name;

                    progressDialog.setMessage(progressString);
                  }
                });

                var downloadThread = new java.lang.Thread(new java.lang.Runnable() {
                  run: function() {
                    downloadFileFromURL(missingFilesList[i].download_url, missingFilesList[i].local_path, missingFilesList[i].name); // URL으로부터 파일 다운로드

                    while ((size = missingFile.length()) < missingFilesList[i].size) { // 다운로드가 덜 된 경우 계속 루프 돌림

                    }
                  }
                });
                downloadThread.start();
                downloadThread.join(); // blocking
              }

              // 상단바 다시 숨김
              hideStatusBar();

              // 스크립트 실행 가능
              isScriptable = true;

            } else if (!isDownloadAllowed) { // 다운로드 거부됨
              toast("다운로드가 거부되었습니다.");
            }

            // 프로그래스 다이얼로그 종료
            if (progressDialog != null) {
              ctx.runOnUiThread(new java.lang.Runnable() {
                run: function() {
                  progressDialog.dismiss();
                  progressDialog = null;
                }
              });
            }
          }
        } catch (e) {
          toast("파일을 체크하는 도중 오류가 발생했습니다.\n" + e + ", " + e.lineNumber);

          // 프로그래스 다이얼로그 종료
          if (progressDialog != null) {
            ctx.runOnUiThread(new java.lang.Runnable() {
              run: function() {
                progressDialog.dismiss();
                progressDialog = null;
              }
            });
          }
        }
      }
    });
    checkFilesThread.start();
  } catch (e) {
    toast("파일을 체크하는 도중 오류가 발생했습니다.\n" + e + ", " + e.lineNumber);
  }
}


function downloadFileFromURL(url, path, fileName) {
  try {
    if (!checkInternet()) {
      toast("네트워크에 연결되어 있지않아 인터넷으로부터 파일을 다운로드 받아올 수 없습니다.");
      return false;
    }

    var downloadQueueId;

    var request = new android.app.DownloadManager.Request(android.net.Uri.parse(url));
    request.setTitle(fileName + " 파일을 다운로드 중입니다...");
    request.setDescription("잠시만 기다려주세요.");
    request.allowScanningByMediaScanner();
    request.setDestinationInExternalPublicDir(path.replace(SD_CARD, "").replace(fileName, ""), fileName); // setDestinationInExternalPublicDir에서 디렉토리 인자는 getExternalFilesDir(String);으로 넘어가기 때문에 절대경로를 제외한 폴더를 사용

    var downloadManager = ctx.getSystemService(ctx.DOWNLOAD_SERVICE);
    downloadQueueId = downloadManager.enqueue(request);
  } catch (e) {
    toast("파일 다운로드에 실패하였습니다!\n" + e + ", " + e.lineNumber);
  }
}


function readURL(url, returnType) {
  if (!checkInternet()) {
    toast("인터넷 연결 상태를 확인해주세요.");
    return "";
  }

  // readURL()을 Thread에서 돌릴 때 너무 많은 데이터를 읽으려 할 경우 오류가 남.
  // 정확한 버그 발생 이유 및 수정 방안은 아직 모름
  try {
    var URLContent = "";
    var bufferedReader = new java.io.BufferedReader(new java.io.InputStreamReader(java.net.URL(url).openStream(), "UTF-8"));

    while ((temp = bufferedReader.readLine()) != null) {
      URLContent += (URLContent == "" ? temp : "\n" + temp);
    }
    bufferedReader.close();
  } catch (e) {
    toast(e + ", " + e.lineNumber);
  }

  // UTF-8 인코딩 과정에서 생길 수 있는 BOM 문자 제거 (for JSON)
  if (URLContent.indexOf(String.fromCharCode(65279)) != -1)
    URLContent.slice(1);

  if (returnType == "array") // 인자로 배열을 넘긴 경우 배열로 출력
    return URLContent.split("\n");
  else // 인자로 배열을 지정하지 않은 경우 하나의 string으로 출력
    return URLContent;
}


function getFilesListFromGitHub(path, recursive, url) {
  if (!checkInternet())
    return undefined;

  var fileList = new Array();

  if (path == undefined) // path 파라미터가 넘어오지 않은 경우
    path = ""; // 최상위 루트 폴더

  try {
    var temp = JSON.parse(readURL(url));
  } catch (e) {
    toast(e + ", " + e.lineNumber);
  }

  if (path != undefined) { // path가 별도로 지정이 된 경우 해당 폴더의 하위 파일만 저장
    for (var i in temp.tree) {
      var file = temp.tree[i];

      if (file.path.indexOf(path + "/") != -1) { // 원소의 경로가 주어진 path의 하위 폴더인 경우
        if (file.type == "blob") { // 원소의 유형이 파일일 때
          if (recursive) { // 해당 path의 하위 폴더의 파일들도 모두 읽을 때
            var fileInfo = {
              "name": (file.path.split("/")[file.path.split("/").length - 1]), // 파일이름 == path를 /로 split 하였을 때 마지막 원소
              "path": file.path,
              "sha": file.sha,
              "size": parseInt(file.size),
              "url": file.url
            };

            fileList.push(fileInfo);
          } else if (!recursive) { // 해당 path의 하위 폴더의 파일들을 읽지 않을 때
            if ((file.path.split(path + "/").slice(1).join(path + "/")).indexOf("/") != -1) { // 해당 파일의 상위 경로가 path뿐일 때
              var fileInfo = {
                "name": (file.path.split("/")[file.path.split("/").length - 1]), // 파일이름 == path를 /로 split 하였을 때 마지막 원소
                "path": file.path,
                "sha": file.sha,
                "size": parseInt(file.size),
                "url": file.url
              };

              fileList.push(fileInfo);
            }
          }
        }
      }
    }
  } else { // path가 지정이 되지 않은 경우 - 최상위 루트 폴더
    fileList = temp.tree;
  }

  return fileList;
}


var resourceLocalFilesNameList = new Array(); // 로컬 리소스 파일들의 이름만 저장할 배열

function getFilesListFromLocal(path, recursive, savedFileList) {
  var fileList = ((savedFileList != undefined) ? savedFileList : new Array());
  var temp = new Array(); // 내부 저장소 파일 리스트를 임시로 저장할 배열

  if (savedFileList == undefined) // 함수 제일 첫 호출시에만 초기화
    resourceLocalFilesNameList = new Array();

  temp = new java.io.File(path).list();

  for (var i in temp) {
    if (new java.io.File(path, temp[i]).isFile()) { // 리스트의 원소가 파일이면
      var fileInfo = {
        "name": (temp[i] + ""), // 파일 이름
        "path": path + "/" + temp[i], // 파일 경로
        "size": parseInt(new java.io.File(path, temp[i]).length()) // 파일 크기
      };
      resourceLocalFilesNameList.push(temp[i] + "");

      fileList.push(fileInfo); // 파일 배열에 파일 정보 추가
    } else if (new java.io.File(path, temp[i]).isDirectory() && recursive) { // 리스트의 원소가 폴더라면
      getFilesListFromLocal(path + "/" + temp[i], true, fileList); // 재귀적으로 파일 리스트 불러옴
    }
  }
  return fileList;
}


/**
 * ImageButton
 * Made by Irenebode
 * Since 170730
 */
function makeImgButton(path, onClickListener, onLongClickListener, onTouchListener, layoutParams) {
  if (new java.io.File(path).exists()) {
    var imgView = new android.widget.ImageView(ctx);
    var bitmap = new android.graphics.BitmapFactory.decodeFile(path);
    imgView.setScaleType(android.widget.ImageView.ScaleType.FIT_XY);
    imgView.setImageBitmap(bitmap);
    imgView.setOnClickListener(onClickListener);
    imgView.setOnLongClickListener(onLongClickListener);
    imgView.setOnTouchListener(onTouchListener);
  } else {
    clientMessage("이미지 파일을 찾을 수 없습니다.");
  }
  if (layoutParams) imgView.setLayoutParams(layoutParams);
  return imgView;
}


/**
 * Toast
 * Made by Irenebode
 * Since 170201
 */
function toast(msg) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var layout = new android.widget.LinearLayout(ctx);
        var toast = new android.widget.Toast(ctx);
        layout.setOrientation(1);
        layout.setGravity(android.view.Gravity.CENTER);

        var textSet = new android.widget.TextView(ctx);
        textSet.setTextColor(android.graphics.Color.BLACK);
        textSet.setGravity(android.view.Gravity.CENTER);
        textSet.setTextSize(13);
        textSet.setText("  " + msg + "  ");
        textSet.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        layout.addView(textSet);

        var border = new android.graphics.drawable.GradientDrawable;
        border.setColor(android.graphics.Color.parseColor(colors[0]));
        border.setStroke(2, android.graphics.Color.parseColor(colors[1]));

        layout.setBackgroundDrawable(border);
        layout.setLayoutParams(new android.widget.LinearLayout.LayoutParams(android.widget.LinearLayout.LayoutParams.WRAP_CONTENT, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT));
        toast.setDuration(android.widget.Toast.LENGTH_LONG);
        toast.setView(layout);
        toast.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * FileDownload
 * Thanks Pandong
 * Since 171214
 */
function download(name, fileURL) {
  try {
    var file = new java.io.File(android.os.Environment.getExternalStorageDirectory(), name);
    if (!file.getParentFile().exists())
      file.getParentFile().mkdirs();
    var url = new java.net.URL(fileURL).openConnection();
    var bis = new java.io.BufferedInputStream(url.getInputStream());
    var bos = new java.io.BufferedOutputStream(new java.io.FileOutputStream(file));
    var read;
    while (true) {
      read = bis.read();
      if (read == -1)
        break;
      bos.write(read);
    }
    bis.close();
    bos.close();
    return true;
  } catch (e) {
    // toast("최신정보를 불러오지 못했습니다");
    clientMessage(e + ", " + e.lineNumber);
    return false;
  }
}


/**
 * showDialog, alertDialog
 * Made by Irenebode
 * Since 170206
 */
function showDialog(title, msg) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        dialog.setTitle(title);
        dialog.setMessage(msg);
        dialog.setNegativeButton("닫기", null);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


function alertDialog(title, content, listener, positive, neutral, negative) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var alertDialog = new android.app.AlertDialog.Builder(ctx, 5);
        alertDialog.setTitle(title.toString());
        alertDialog.setMessage(content.toString());

        if (positive != null) alertDialog.setPositiveButton(positive, listener);
        if (neutral != null) alertDialog.setNeutralButton(neutral, listener);
        if (negative != null) alertDialog.setNegativeButton(negative, listener);

        alertDialog.show();
      } catch (e) {
        toast("다이얼로그를 생성하는 과정에서 문제가 발생했습니다.\n" + e + ", " + e.lineNumber);
      }
    }
  }));
}


/*
 * (show/hide)StatusBar
 * Thanks ToonRaon
 * Since 171214
 */
function showStatusBar() {
  try {
    ctx.runOnUiThread(new java.lang.Runnable() {
      run: function() {
        ctx.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
      }
    });
  } catch (e) {
    toast("상단바 호출 에러!");
  }
}


function hideStatusBar() {
  try {
    ctx.runOnUiThread(new java.lang.Runnable() {
      run: function() {
        ctx.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
      }
    });
  } catch (e) {
    toast("상단바 숨김 에러!");
  }
}


/**
 * setWindow
 * Thanks Pandong
 * Since 170730
 */
function setWindow(targetWindow, contentView, width, height, drawable, focusable, location) {
  targetWindow.setContentView(contentView);
  targetWindow.setWidth(width);
  targetWindow.setHeight(height);
  targetWindow.setBackgroundDrawable(drawable);
  targetWindow.setFocusable(focusable);

  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        targetWindow.showAtLocation(location[0], location[1], location[2], location[3]);
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * makeCoordInput
 * Thanks Pandong
 * Since 171029
 */
function makeCoordInput(text, edit) {
  var layout = new android.widget.LinearLayout(ctx);
  layout.addView(text);
  layout.addView(edit);
  return layout;
}


/**
 * Check for updates
 * Made by Irenebode
 * Since 171001
 */
function readFile(saveFilePath) {
  if (!java.io.File(android.os.Environment.getExternalStorageDirectory(), saveFilePath).exists())
    return false;
  var fr = new java.io.FileReader(android.os.Environment.getExternalStorageDirectory() + saveFilePath);
  var br = new java.io.BufferedReader(fr);
  var str = "";
  var s = "";
  while ((s = br.readLine()) != null) str += s + "\n";
  br.close();
  fr.close();
  return str;
}


var checkVer = false;

function checkVersion() {
  try {
    if (checkInternet()) {
      if (download(RESOURCE_PATH + "ScriptInfo.txt", VERSION_CHECK_URL)) {
        var string = readFile(RESOURCE_PATH + "ScriptInfo.txt");
        var blocks = string.split("\n\n");
        var blocks2 = new Array();
        var i;
        var name, version, maker;

        for (i = 0; i < blocks.length; i++) {
          name = blocks[i].split("\n")[0].split(" : ")[1];
          version = blocks[i].split("\n")[1].split(" : ")[1];
          maker = blocks[i].split("\n")[2].split(" : ")[1];
          blocks2.push([name, version, maker]);
        }

        for (i = 0; i < blocks2.length; i++) {
          if (blocks2[i][0] == info.name) {
            if (blocks2[i][1] == info.version && blocks2[i][2] == info.maker) {
              toast("최신 버전입니다");
            } else if (blocks2[i][1] == info.version) {
              toast("잘못된 행위를 한 당신에게 저주를.");
            } else {
              updatePopup();
            }
          }
        }
      }
    } else {
      toast("최신버전을 확인할 수 없습니다. 인터넷 연결 여부를 확인하세요.");
    }
  } catch (e) {
    toast(e + ", " + e.lineNumber);
  }
}


function updatePopup() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);
        layout.setGravity(android.view.Gravity.LEFT);

        var title = new android.widget.TextView(ctx);
        title.setText("최신버전 발견!");
        title.setTextColor(android.graphics.Color.WHITE);
        title.setTextSize(24);
        title.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        layout.addView(title);

        var txt = new android.widget.TextView(ctx);
        txt.setText("\n  최신버전이 발견되었습니다. 다운로드할 방법을 선택하세요.");
        txt.setTextColor(android.graphics.Color.BLACK);
        txt.setTextSize(18);
        txt.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        layout.addView(txt);

        var scroll = android.widget.ScrollView(ctx);
        scroll.addView(layout);
        dialog.setView(scroll);
        dialog.setNegativeButton("취소", null);
        dialog.setNeutralButton("블로그 이동", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("https://blog.naver.com/kth020315/221178975884"));
            ctx.startActivity(intent);
          }
        }));
        dialog.setPositiveButton("카페 이동", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse("http://cafe.naver.com/minecraftpe/2684697"));
            ctx.startActivity(intent);
          }
        }));
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * Check Internet
 * Thanks Dark Tornado
 * Since 171001
 */
function checkInternet() {
  try {
    var ctxm = ctx.getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
    var mobile = ctxm.getNetworkInfo(ctxm.TYPE_MOBILE);
    var wifi = ctxm.getNetworkInfo(ctxm.TYPE_WIFI);
    if (mobile.isConnected() || wifi.isConnected()) return true;
    else return false;
  } catch (e) {
    try {
      if (wifi.isConnected()) return true;
    } catch (e) {
      clientMessage(e + ", " + e.lineNumber);
    }
  }
}


/**
 * Main Source
 */
function showWindow(window, gravity, x, y) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        window.showAtLocation(ctx.getWindow().getDecorView(), gravity, x, y);
      } catch (e) {
        toast("윈도우를 생성하는 도중 에러가 발생하였습니다.\n" + e + ", " + e.lineNumber);
      }
    }
  }));
}


function closeWindow(window) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      if (window != null) {
        window.dismiss();
        window = null;
      }
    }
  }));
}


function newLevel() {
  if (!isScriptable) return;

  if (readData("primary_start") != "false") {
    tutorialDialog();
    saveData("primary_start", false);
  }

  makeMainBtn();
  //makeSubBtn();
  makeToolBtn();
  makeCmdBtn();
  makeUndoBtn();
  makeRedoBtn();
  makeContiBtn();
}


function leaveGame() {
  guiExit();
  Entity.removeEffect(getPlayerEnt(), MobEffect.nightVision);
  currentGameSpeed = 20;
}


function guiExit() {
  if (posBackground != null) closeWindow(posBackground);
  if (focusBackground != null) closeWindow(focusBackground);
  if (itemBackground != null) closeWindow(itemBackground);

  if (windows.mainWindow != null) closeWindow(windows.mainWindow);
  if (windows.main != null) closeWindow(windows.main);
  if (windows.cmd != null) closeWindow(windows.cmd);
  if (windows.progressWindow != null) closeWindow(windows.progressWindow);
  if (windows.toolWindow != null) closeWindow(windows.toolWindow);
  if (windows.cmdWindow != null) closeWindow(windows.cmdWindow);
  if (windows.undoWindow != null) closeWindow(windows.undoWindow);
  if (windows.redoWindow != null) closeWindow(windows.redoWindow);
  if (windows.contiWindow != null) closeWindow(windows.contiWindow);
  if (windows.imageViewerWindow != null) closeWindow(windows.imageViewerWindow);

  if (GUIWindow != null) closeWindow(GUIWindow);
}


function startDestroyBlock(x, y, z) {
  var item = Player.getCarriedItem();
  var block = Level.getTile(x, y, z);
  var blockData = Level.getData(x, y, z);

  if (item == 271) {
    if (!isScriptable) return;
    if (!woodenAxeOnoff) return;

    setTile(x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z));
    Level.playSound(x, y, z, "random.click", 1, 1);
    worldEditMemory.blockSave.push({
      bx: x,
      by: y,
      bz: z,
      id: Level.getTile(x, y, z),
      data: Level.getData(x, y, z),
      delay: 0
    });
    worldEditMemory.pos2 = [x, y, z];
    clientMessage(ChatColor.RED + "두번째 지점이 (" + worldEditMemory.pos2 + ") 으로 설정되었습니다.");
    /*new java.lang.Thread({
        run: function(){
    			Level.setTile(x, y, z, 159, 14);
    			java.lang.Thread.sleep(500);
    			Level.setTile(x, y, z, block, blockData);
        }
      }).start();*/
  }
}


function useItem(x, y, z, item, block, side, itemData, blockData) {
  if (item == 271) {
    if (!isScriptable) return;
    if (!woodenAxeOnoff) return;

    setTile(x, y, z, Level.getTile(x, y, z), Level.getData(x, y, z));
    Level.playSound(x, y, z, "random.click", 1, 1);
    worldEditMemory.pos1 = [x, y, z];
    clientMessage(ChatColor.RED + "첫번째 지점이 (" + worldEditMemory.pos1 + ") 으로 설정되었습니다.");
    /*new java.lang.Thread({
        run: function(){
    			Level.setTile(x, y, z, 159, 14);
    			java.lang.Thread.sleep(300);
    			Level.setTile(x, y, z, block, blockData);
        }
      }).start();*/
  }

  if (isRoadMakerOn) {
    preventDefault();
    stopRoadMaker();
  }

  if (isStairMakerOn) {
    preventDefault();
    stopStairMaker();
  }

  if (blockInfo) {
    preventDefault();
    toast("블럭좌표 | X : " + x + ", Y : " + y + ", Z : " + z + "  \n  블럭코드(Id:Data) | " + block + ":" + blockData + "");
  }

  if (quickRemove) {
    preventDefault();
    setTile(x, y, z, 0);
    return;
  }

  if (quickChange && item <= 255) {
    preventDefault();
    Level.playSound(x, y, z, "step.stone", 1, 1);
    Level.setTile(x, y, z, item, itemData);
    return;
  }

  if (upBlock && item <= 255) {
    preventDefault();
    for (var i = 1; i < Height; i++) Level.setTile(x, y + i, z, item, itemData);
  }

  if (downBlock && item <= 255) {
    preventDefault();
    for (var i = 1; i < Down; i++) Level.setTile(x, y - i, z, item, itemData);
  }

  if (signChange && (block == 63 || block == 68)) {
    signEditor(x, y, z);
    preventDefault();
  }
}


function modTick() {
  if (checkVer) {
    checkVersion();
    checkVer = false;
  }

  var x = Player.getX();
  var y = Player.getY();
  var z = Player.getZ();
  var item = Player.getCarriedItem();
  var itemData = Player.getCarriedItemData();
  var yaw = Entity.getYaw(Player.getEntity());
  var pitch = Entity.getPitch(Player.getEntity());
  var sinHorizontal = Math.sin(int2deg(yaw));
  var cosHorizontal = Math.cos(int2deg(yaw));
  var sinVertical = Math.sin(int2deg(-pitch));
  var cosVertical = Math.cos(int2deg(-pitch));

  if (isRoadMakerOn && item <= 255) {
    roadMaker(roadMakerPos[0], roadMakerPos[1], roadMakerPos[2], deltaX, deltaZ, item, itemData);

    if (Math.round(sinHorizontal) == 1) deltaX--;
    else if (Math.round(sinHorizontal) == -1) deltaX++;
    else if (Math.round(cosHorizontal) == -1) deltaZ--;
    else if (Math.round(cosHorizontal) == 1) deltaZ++;
  }

  if (isStairMakerOn && count % 5 == 0 && item <= 255) {
    stairMaker(stairMakerPos[0], stairMakerPos[1], stairMakerPos[2], deltaX, deltaY, deltaZ, item, itemData);

    if (Math.round(sinHorizontal) == 1) deltaX--;
    else if (Math.round(sinHorizontal) == -1) deltaX++;
    else if (Math.round(cosHorizontal) == -1) deltaZ--;
    else if (Math.round(cosHorizontal) == 1) deltaZ++;

    if (sinVertical <= 0) deltaY++;
    else if (sinVertical > 0) deltaY--;
  }

  if (timeLock) Level.setTime(timeLockData);

  var i;
  var spawnLength = entityManager.spawn.length;
  for (i = 0; i < spawnLength; i++) {
    for (var i2 = 0; i2 < entityManager.spawn[i][4]; i2++) {
      Level.spawnMob(entityManager.spawn[i][1], entityManager.spawn[i][2], entityManager.spawn[i][3], entityManager.spawn[i][0]);
    }
    entityManager.spawn.splice(i, 1);
    spawnLength--;
    i--;
  }

  var removeLength = entityManager.remove.length;
  for (i = 0; i < removeLength; i++) {
    entityManager.removeEntity(entityManager.remove[i]);
    entityManager.remove.splice(i, 1);
    removeLength--;
    i--;
  }

  if (footBlock && item <= 255) Level.setTile(gauss(x), y - 2, gauss(z), item, itemData);

  if (headBlock && item <= 255) Level.setTile(gauss(x), y + 1, gauss(z), item, itemData);

  if (posNow) {
    ctx.runOnUiThread(new java.lang.Runnable({
      run: function() {
        try {
          posTxt.setText(" X : " + Math.round(Player.getX()) + ", Y : " + Math.floor(Player.getY()) + ", Z : " + Math.round(Player.getZ()) + " B : " + Level.getBiomeName(Player.getX(), Player.getZ) + " ");
          posTxt.setShadowLayer(7, 3, 3, android.graphics.Color.GRAY);
          posTxt.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        } catch (e) {
          clientMessage(e + ", " + e.lineNumber);
        }
      }
    }));
  }

  if (focusInfo) {
    ctx.runOnUiThread(new java.lang.Runnable({
      run: function() {
        try {
          focusTxt.setText(" 블럭좌표 | X : " + Player.getPointedBlockX() + ", Y : " + Player.getPointedBlockY() + ", Z : " + Player.getPointedBlockZ() + " | 블럭코드(Id:Data) | " + Player.getPointedBlockId() + ":" + Player.getPointedBlockData() + " ");
          focusTxt.setShadowLayer(7, 3, 3, android.graphics.Color.GRAY);
          focusTxt.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        } catch (e) {
          clientMessage(e + ", " + e.lineNumber);
        }
      }
    }));
  }

  if (itemInfo) {
    ctx.runOnUiThread(new java.lang.Runnable({
      run: function() {
        try {
          itemTxt.setText(" 현재 아이템 아이디 : " + Player.getCarriedItem() + ", 아이템 데이터 : " + Player.getCarriedItemData() + " ");
          itemTxt.setShadowLayer(7, 3, 3, android.graphics.Color.GRAY);
          itemTxt.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        } catch (e) {
          clientMessage(e + ", " + e.lineNumber);
        }
      }
    }));
  }

  var blockSaveLength = worldEditMemory.blockSave.length;
  for (var i = 0; i < blockSaveLength; i++) {
    if (worldEditMemory.blockSave[i].delay == 0) {
      setTile(worldEditMemory.blockSave[i].bx, worldEditMemory.blockSave[i].by, worldEditMemory.blockSave[i].bz, worldEditMemory.blockSave[i].id, worldEditMemory.blockSave[i].data);
      worldEditMemory.blockSave.splice(i, 1);
      blockSaveLength--;
      i--;
    } else {
      worldEditMemory.blockSave[i].delay--;
    }
  }

  if (commandDetector) {
    commandDetector = false;
    commandHandler(selectedCommand);
  }
}


function entityAddedHook(e) {
  if (Entity.getEntityTypeId(e) != 0) entities.push(e);

  if (antiEnt && !Player.isPlayer(e) && Entity.getEntityTypeId(e) != 83) Entity.remove(e);
}


function entityRemovedHook(e) {
  entities.splice(entities.indexOf(e), 1);
}


/**
 * MainButton
 * Made by Irenebode
 * Since 170730
 */
function makeMainBtn() {
  var mainLayout = new android.widget.RelativeLayout(ctx);
  windows.mainWindow = new android.widget.PopupWindow(mainLayout, -2, -2);

  var mainBtn = makeImgButton(GUI_PATH + "/ic_main.png", new android.view.View.OnClickListener({
    onClick: function(v) {
      if (!isScriptable) return;
      main();
    }
  }), null, null, false);
  mainLayout.addView(mainBtn);

  setWindow(windows.mainWindow, mainLayout, dip2px(50), dip2px(50), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.LEFT | android.view.Gravity.TOP, (readData("main_button_x") == "" || readData("main_button_x") == "undefined") ? dip2px(2) : parseInt(readData("main_button_x")), (readData("main_button_y") == "" || readData("main_button_y") == "undefined") ? dip2px(4) : parseInt(readData("main_button_y"))]);

  setDragable(windows.mainWindow, mainBtn, "main_button_x", "main_button_y", 0);
}


/**
 * SubButton
 * Made by Irenebode
 * Since 170801
 */
function makeToolBtn() {
  windows.toolWindow = new android.widget.PopupWindow();

  var toolBtn = makeImgButton(GUI_PATH + "/ic_woodenaxe.png", new android.view.View.OnClickListener({
    onClick: function(v) {
      if (!isScriptable) return;
      if (Player.getCarriedItem() != 0) {
        Entity.setCarriedItem(Player.getEntity(), 271, 1, 0);
        toast("블럭을 짧게 터치 : 지점1 설정  \n  블럭을 길게 터치 : 지점2 설정");
      } else {
        toast("아무런 아이템도 쥐고있지 않아 지급할 수 없습니다.");
      }
    }
  }), null, new android.view.View.OnTouchListener({
    onTouch: function(v, event) {
      if (btnInfoOnoff) {
        switch (event.action) {
          case android.view.MotionEvent.ACTION_DOWN:
            toolBtnInfoPopup();
            break;

          case android.view.MotionEvent.ACTION_UP:
            closeWindow(subBtnInfoPopupWindow);
            subBtnInfoPopupWindow = null;
            break;
        }
      }
      return false;
    }
  }), false);

  setWindow(windows.toolWindow, toolBtn, dip2px(30), dip2px(30), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(2), dip2px(50)]);
}


function makeCmdBtn() {
  windows.cmdWindow = new android.widget.PopupWindow();

  var cmdBtn = makeImgButton(GUI_PATH + "/ic_cmd.png", new android.view.View.OnClickListener({
    onClick: function(v) {
      if (!isScriptable) return;
      chooseCmd();
    }
  }), null, new android.view.View.OnTouchListener({
    onTouch: function(v, event) {
      if (btnInfoOnoff) {
        switch (event.action) {
          case android.view.MotionEvent.ACTION_DOWN:
            cmdBtnInfoPopup();
            break;

          case android.view.MotionEvent.ACTION_UP:
            closeWindow(subBtnInfoPopupWindow);
            subBtnInfoPopupWindow = null;
            break;
        }
      }
      return false;
    }
  }), false);

  setWindow(windows.cmdWindow, cmdBtn, dip2px(30), dip2px(30), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(2), dip2px(85)]);
}


function makeUndoBtn() {
  windows.undoWindow = new android.widget.PopupWindow();

  var undoBtn = makeImgButton(GUI_PATH + "/ic_undo.png", new android.view.View.OnClickListener({
    onClick: function(v) {
      if (!isScriptable) return;
      commandDetector = true;
      selectedCommand = "되돌리기";
    }
  }), null, new android.view.View.OnTouchListener({
    onTouch: function(v, event) {
      if (btnInfoOnoff) {
        switch (event.action) {
          case android.view.MotionEvent.ACTION_DOWN:
            undoBtnInfoPopup();
            break;

          case android.view.MotionEvent.ACTION_UP:
            closeWindow(subBtnInfoPopupWindow);
            subBtnInfoPopupWindow = null;
            break;
        }
      }
      return false;
    }
  }), false);

  setWindow(windows.undoWindow, undoBtn, dip2px(30), dip2px(30), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(2), dip2px(120)]);
}


function makeRedoBtn() {
  windows.redoWindow = new android.widget.PopupWindow();

  var redoBtn = makeImgButton(GUI_PATH + "/ic_redo.png", new android.view.View.OnClickListener({
    onClick: function(v) {
      if (!isScriptable) return;
      commandDetector = true;
      selectedCommand = "다시실행";
    }
  }), null, new android.view.View.OnTouchListener({
    onTouch: function(v, event) {
      if (btnInfoOnoff) {
        switch (event.action) {
          case android.view.MotionEvent.ACTION_DOWN:
            redoBtnInfoPopup();
            break;

          case android.view.MotionEvent.ACTION_UP:
            closeWindow(subBtnInfoPopupWindow);
            subBtnInfoPopupWindow = null;
            break;
        }
      }
      return false;
    }
  }), false);

  setWindow(windows.redoWindow, redoBtn, dip2px(30), dip2px(30), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(2), dip2px(155)]);
}


function makeContiBtn() {
  windows.contiWindow = new android.widget.PopupWindow();

  contiBtn = new android.widget.Button(ctx);
  contiBtn.setText("최근\n작업");
  contiBtn.setTextColor(android.graphics.Color.BLACK);
  contiBtn.setTextSize(10);
  contiBtn.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
  contiBtn.setOnClickListener(new android.view.View.OnClickListener({
    onClick: function(v) {
      if (!isScriptable) return;
      continueCommand = true;
      commandDetector = true;
      selectedCommand = savedCommand;
    }
  }));
  contiBtn.setOnTouchListener(new android.view.View.OnTouchListener({
    onTouch: function(v, event) {
      if (btnInfoOnoff) {
        switch (event.action) {
          case android.view.MotionEvent.ACTION_DOWN:
            contiBtnInfoPopup();
            break;

          case android.view.MotionEvent.ACTION_UP:
            closeWindow(subBtnInfoPopupWindow);
            subBtnInfoPopupWindow = null;
            break;
        }
      }
      return false;
    }
  }));
  contiBtn.setBackgroundColor(android.graphics.Color.parseColor(colors[0]));

  setWindow(windows.contiWindow, contiBtn, dip2px(30), dip2px(30), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(2), dip2px(190)]);
}


var subBtnInfoPopupWindow;

function toolBtnInfoPopup() {
  subBtnInfoPopupWindow = new android.widget.PopupWindow(ctx)
  var subBtnInfoPopupLayout = new android.widget.RelativeLayout(ctx);

  var toolBtnInfoPopup = new android.widget.TextView(ctx);
  toolBtnInfoPopup.setText("[나무 도끼]\n현재 들고 있는 아이템을 나무도끼로 변경합니다.\n아무런 아이템도 쥐고있지 않은 경우 효과가 없습니다.\n\n나무도끼를 들고 블럭을 짧게 터치하면 해당 블럭의 위치가 지점1로,\n블럭을 (마치 부수는 것처럼) 길게 터치하면 해당 블럭의 위치가 지점2로 설정됩니다.");
  toolBtnInfoPopup.setTextSize(10);
  toolBtnInfoPopup.setTextColor(android.graphics.Color.WHITE);
  toolBtnInfoPopup.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
  toolBtnInfoPopup.setBackgroundColor(android.graphics.Color.BLACK);
  toolBtnInfoPopup.setPadding(dip2px(5), dip2px(5), dip2px(5), dip2px(5));
  subBtnInfoPopupLayout.addView(toolBtnInfoPopup);

  subBtnInfoPopupWindow.setContentView(subBtnInfoPopupLayout);
  subBtnInfoPopupWindow.setFocusable(true);
  subBtnInfoPopupWindow.setWidth(-2);
  subBtnInfoPopupWindow.setHeight(-2);
  subBtnInfoPopupWindow.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(37), dip2px(50));
}


function cmdBtnInfoPopup() {
  subBtnInfoPopupWindow = new android.widget.PopupWindow(ctx);
  var subBtnInfoPopupLayout = new android.widget.RelativeLayout(ctx);

  var cmdBtnInfoPopup = new android.widget.TextView(ctx);
  cmdBtnInfoPopup.setText("[명령어 버튼]\n명령어를 GUI를 통해서 쉽게 사용할 수 있습니다.");
  cmdBtnInfoPopup.setTextSize(10);
  cmdBtnInfoPopup.setTextColor(android.graphics.Color.WHITE);
  cmdBtnInfoPopup.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
  cmdBtnInfoPopup.setBackgroundColor(android.graphics.Color.BLACK);
  cmdBtnInfoPopup.setPadding(dip2px(5), dip2px(5), dip2px(5), dip2px(5));
  subBtnInfoPopupLayout.addView(cmdBtnInfoPopup);

  subBtnInfoPopupWindow.setContentView(subBtnInfoPopupLayout);
  subBtnInfoPopupWindow.setFocusable(true);
  subBtnInfoPopupWindow.setWidth(-2);
  subBtnInfoPopupWindow.setHeight(-2);
  subBtnInfoPopupWindow.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(37), dip2px(87));
}


function undoBtnInfoPopup() {
  subBtnInfoPopupWindow = new android.widget.PopupWindow(ctx);
  var subBtnInfoPopupLayout = new android.widget.RelativeLayout(ctx);

  var undoBtnInfoPopup = new android.widget.TextView(ctx);
  undoBtnInfoPopup.setText("[되돌리기 버튼]\n최근 작업을 취소합니다.");
  undoBtnInfoPopup.setTextSize(10);
  undoBtnInfoPopup.setTextColor(android.graphics.Color.WHITE);
  undoBtnInfoPopup.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
  undoBtnInfoPopup.setBackgroundColor(android.graphics.Color.BLACK);
  undoBtnInfoPopup.setPadding(dip2px(5), dip2px(5), dip2px(5), dip2px(5));
  subBtnInfoPopupLayout.addView(undoBtnInfoPopup);

  subBtnInfoPopupWindow.setContentView(subBtnInfoPopupLayout);
  subBtnInfoPopupWindow.setFocusable(true);
  subBtnInfoPopupWindow.setWidth(-2);
  subBtnInfoPopupWindow.setHeight(-2);
  subBtnInfoPopupWindow.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(37), dip2px(124));
}


function redoBtnInfoPopup() {
  subBtnInfoPopupWindow = new android.widget.PopupWindow(ctx);
  var subBtnInfoPopupLayout = new android.widget.RelativeLayout(ctx);

  var redoBtnInfoPopup = new android.widget.TextView(ctx);
  redoBtnInfoPopup.setText("[다시실행 버튼]\n되돌렸던 지형을 다시 불러옵니다.");
  redoBtnInfoPopup.setTextSize(10);
  redoBtnInfoPopup.setTextColor(android.graphics.Color.WHITE);
  redoBtnInfoPopup.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
  redoBtnInfoPopup.setBackgroundColor(android.graphics.Color.BLACK);
  redoBtnInfoPopup.setPadding(dip2px(5), dip2px(5), dip2px(5), dip2px(5));
  subBtnInfoPopupLayout.addView(redoBtnInfoPopup);

  subBtnInfoPopupWindow.setContentView(subBtnInfoPopupLayout);
  subBtnInfoPopupWindow.setFocusable(true);
  subBtnInfoPopupWindow.setWidth(-2);
  subBtnInfoPopupWindow.setHeight(-2);
  subBtnInfoPopupWindow.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(37), dip2px(161));
}


function contiBtnInfoPopup() {
  subBtnInfoPopupWindow = new android.widget.PopupWindow(ctx);
  var subBtnInfoPopupLayout = new android.widget.RelativeLayout(ctx);

  var contiBtnInfoPopup = new android.widget.TextView(ctx);
  contiBtnInfoPopup.setText("[최근작업 버튼]\n최근 작업을 실행합니다.");
  contiBtnInfoPopup.setTextSize(10);
  contiBtnInfoPopup.setTextColor(android.graphics.Color.WHITE);
  contiBtnInfoPopup.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
  contiBtnInfoPopup.setBackgroundColor(android.graphics.Color.BLACK);
  contiBtnInfoPopup.setPadding(dip2px(5), dip2px(5), dip2px(5), dip2px(5));
  subBtnInfoPopupLayout.addView(contiBtnInfoPopup);

  subBtnInfoPopupWindow.setContentView(subBtnInfoPopupLayout);
  subBtnInfoPopupWindow.setFocusable(true);
  subBtnInfoPopupWindow.setWidth(-2);
  subBtnInfoPopupWindow.setHeight(-2);
  subBtnInfoPopupWindow.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, dip2px(37), dip2px(198));
}


/**
 * Main
 * Made by Irenebode
 * Since 170803
 */
function main() {
  try {
    windows.main = new android.widget.PopupWindow();

    var layout = new android.widget.LinearLayout(ctx);
    layout.setOrientation(1);

    var title = new android.widget.Button(ctx);
    var image = new android.graphics.BitmapFactory.decodeFile(GUI_PATH + "/title_1.2.png");
    title.setBackgroundDrawable(new android.graphics.drawable.BitmapDrawable(image));
    title.setWidth(dip2px(300));
    title.setHeight(dip2px(90));
    layout.addView(title);

    var main = mainMenu();
    layout.addView(main);

    windows.main.setContentView(layout);
    windows.main.setFocusable(true);
    windows.main.setWidth(ctx.getWindowManager().getDefaultDisplay().getWidth() * 4 / 5);
    windows.main.setHeight(ctx.getWindowManager().getDefaultDisplay().getHeight());
    windows.main.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[1])));
    windows.main.setAnimationStyle(android.R.style.Animation_Dialog);
    windows.main.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, 0, 0);
  } catch (e) {
    clientMessage(e + ", " + e.lineNumber);
  }
}


function mainMenu() {
  try {
    var layout = new android.widget.LinearLayout(ctx);
    layout.setOrientation(0);

    var layout1 = new android.widget.LinearLayout(ctx);
    layout1.setOrientation(1);

    var btnsT = [];
    var menusT = ["좌표 표시", "포커스정보 표시", "아이템정보 표시", "터치한 블럭정보 표시", "빠른 제거", "빠른 변경", "발블럭", "머리블럭", "블럭 위로 쌓기", "블럭 아래로 쌓기", "표지판 수정"];
    var menusTon = ["좌표 표시 ON", "포커스정보 표시 ON", "아이템정보 표시 ON", "터치한 블럭정보 표시 ON", "빠른 제거 ON", "빠른 변경 ON", "발블럭 ON", "머리블럭 ON", "블럭 위로 쌓기 ON", "블럭 아래로 쌓기 ON", "표지판 수정 ON"];
    var menusToff = ["좌표 표시 OFF", "포커스정보 표시 OFF", "아이템정보 표시 OFF", "터치한 블럭정보 표시 OFF", "빠른 제거 OFF", "빠른 변경 OFF", "발블럭 OFF", "머리블럭 OFF", "블럭 위로 쌓기 OFF", "블럭 아래로 쌓기 OFF", "표지판 수정 OFF"];
    var bools = [posNow, focusInfo, itemInfo, blockInfo, quickRemove, quickChange, footBlock, headBlock, upBlock, downBlock, signChange];

    for (var i in menusT) {
      btnsT[i] = new android.widget.ToggleButton(ctx);
      btnsT[i].setTextOn(menusTon[i]);
      btnsT[i].setTextOff(menusToff[i]);
      btnsT[i].setTextSize(15);
      btnsT[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
      btnsT[i].setPadding(dip2px(5), 0, dip2px(5), 0);
      btnsT[i].setId(i);
      btnsT[i].setChecked(bools[i]);
      btnsT[i].setTextColor(android.graphics.Color.BLACK);
      btnsT[i].setLayoutParams(new android.widget.LinearLayout.LayoutParams(margin));

      var ripple = new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(android.graphics.Color.GRAY), new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[0])), null);
      btnsT[i].setBackgroundDrawable(ripple);

      btnsT[i].setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
        onCheckedChanged: function(toggle, onoff) {
          switch (toggle.getId()) {
            case 0:
              if (onoff) {
                posNow = true;
                showPos();
              } else {
                posNow = false;
                closeWindow(posBackground);
              }
              break;

            case 1:
              if (onoff) {
                focusInfo = true;
                showFocusInfo();
              } else {
                focusInfo = false;
                closeWindow(focusBackground);
              }
              break;

            case 2:
              if (onoff) {
                itemInfo = true;
                showItemInfo();
              } else {
                itemInfo = false;
                closeWindow(itemBackground);
              }
              break;

            case 3:
              if (onoff) blockInfo = true;
              else blockInfo = false;
              break;

            case 4:
              if (onoff) quickRemove = true;
              else quickRemove = false;
              break;

            case 5:
              if (onoff) quickChange = true;
              else quickChange = false;
              break;

            case 6:
              if (onoff) footBlock = true;
              else footBlock = false;
              break;

            case 7:
              if (onoff) headBlock = true;
              else headBlock = false;
              break;

            case 8:
              if (onoff) {
                upBlock = true
                buildDialog();
              } else {
                upBlock = false;
              }
              break;

            case 9:
              if (onoff) {
                downBlock = true;
                buildDialog();
              } else {
                downBlock = false;
              }
              break;

            case 10:
              if (onoff) signChange = true;
              else signChange = false;
              break;
          }
        }
      }));
      layout1.addView(btnsT[i]);
    }

    var scroll1 = new android.widget.ScrollView(ctx);
    scroll1.addView(layout1);
    scroll1.setLayoutParams(new android.widget.LinearLayout.LayoutParams(ctx.getWindowManager().getDefaultDisplay().getWidth() * 2 / 5, -1));

    var layout2 = new android.widget.LinearLayout(ctx);
    layout2.setOrientation(1);

    var btns = [];
    var menus = ["로드메이커", "계단메이커", "지점1 설정", "지점2 설정", "게임모드 변경", "시간 설정", "날씨 설정", "튜토리얼", "스폰지역 설정", "엔티티 관리", "게임속도", "이미지뷰어", "옵션"];

    for (var i in menus) {
      btns[i] = new android.widget.Button(ctx);
      btns[i].setText(menus[i]);
      btns[i].setTextSize(15);
      btns[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
      btns[i].setPadding(dip2px(5), 0, dip2px(5), 0);
      btns[i].setId(i);
      btns[i].setTextColor(android.graphics.Color.BLACK);
      btns[i].setLayoutParams(new android.widget.LinearLayout.LayoutParams(margin));

      var ripple = new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(android.graphics.Color.GRAY), new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[0])), null);
      btns[i].setBackgroundDrawable(ripple);

      btns[i].setOnClickListener(new android.view.View.OnClickListener({
        onClick: function(v) {
          switch (v.getId()) {
            case 0:
              if (roadCount == 0) {
                initializeRoadMaker(Player.getX(), Player.getY() - 2, Player.getZ());
                roadCount = 1;
                closeWindow(windows.main);
              } else {
                stopRoadMaker();
                roadCount = 0;
                closeWindow(windows.main);
              }
              break;

            case 1:
              if (stairCount == 0) {
                initializeStairMaker(Player.getX(), Player.getY() - 2, Player.getZ());
                stairCount = 1;
                closeWindow(windows.main);
              } else {
                stopStairMaker();
                stairCount = 0;
                closeWindow(windows.main);
              }
              break;

            case 2:
              if (!woodenAxeOnoff) return;
              worldEditMemory.pos1 = [parseInt(Player.getX()), parseInt(Player.getY()) - 1, parseInt(Player.getZ())];
              clientMessage(ChatColor.RED + "첫번째 지점이 (" + worldEditMemory.pos1 + ") 으로 설정되었습니다.");
              closeWindow(windows.main);
              break;

            case 3:
              if (!woodenAxeOnoff) return;
              worldEditMemory.pos2 = [parseInt(Player.getX()), parseInt(Player.getY()) - 1, parseInt(Player.getZ())];
              clientMessage(ChatColor.RED + "두번째 지점이 (" + worldEditMemory.pos1 + ") 으로 설정되었습니다.");
              closeWindow(windows.main);
              break;

            case 4:
              if (Level.getGameMode() == 0) {
                Level.executeCommand("/gamemode 1",  true);
                Level.setGameMode(1);
                toast("크리에이티브로 변경되었습니다.");
              } else if (Level.getGameMode() == 1) {
                Level.executeCommand("/gamemode 0",  true);
                Level.setGameMode(0);
                toast("서바이벌로 변경되었습니다.");
              }
              break;

            case 5:
              timeSet();
              break;

            case 6:
              weatherSet();
              break;

            case 7:
              tutorialDialog();
              break;

            case 8:
              Level.setSpawn(Player.getX(), Player.getY(), Player.getZ());
              toast("현재 위치를 스폰지역으로 설정했습니다.");
              break;

            case 9:
              entityMain();
              break;

            case 10:
              gameSpeedSet();
              break;

            case 11:
              imageViewerSetDialog();
              break;

            case 12:
              optionMain();
              break;
          }
        }
      }));
      layout2.addView(btns[i]);
    }

    var scroll2 = new android.widget.ScrollView(ctx);
    scroll2.addView(layout2);
    scroll2.setLayoutParams(new android.widget.LinearLayout.LayoutParams(ctx.getWindowManager().getDefaultDisplay().getWidth() * 2 / 5, -1));

    layout.addView(scroll1);
    layout.addView(scroll2);

    var mainLayout = new android.widget.RelativeLayout(ctx);
    mainLayout.addView(layout);
    return mainLayout;
  } catch (e) {
    clientMessage(e + ", " + e.lineNumber);
  }
}


/**
 * Choose CMD
 * Made by Irenebode
 * Since 171217
 */
function chooseCmd() {
  try {
    windows.cmd = new android.widget.PopupWindow();

    var layout = new android.widget.LinearLayout(ctx);
    layout.setOrientation(1);

    var title = new android.widget.TextView(ctx);
    title.setText("  원하는 명령어를 선택하세요.");
    title.setTextColor(android.graphics.Color.WHITE);
    title.setTextSize(23);
    title.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
    title.setGravity(android.view.Gravity.LEFT);
    title.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[1])));
    layout.addView(title);

    var btns = [];
    var menus = ["채우기", "비우기", "바꾸기", "남기기", "벽", "구", "반구", "빈구", "빈반구", "역 반구", "역 빈반구", "원기둥", "빈원기둥", "피라미드", "빈피라미드", "회전 90도", "회전 180도", "회전 270도", "X축 대칭", "Y축 대칭", "Z축 대칭", "흡수", "복사", "붙여넣기", "원", "빈원", "덮기", "위로 이동", "쌓기"];

    for (var i in menus) {
      btns[i] = new android.widget.Button(ctx);
      btns[i].setText(menus[i]);
      btns[i].setTextSize(15);
      btns[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
      btns[i].setPadding(dip2px(5), 0, dip2px(5), 0);
      btns[i].setId(i);
      btns[i].setTextColor(android.graphics.Color.BLACK);
      btns[i].setLayoutParams(new android.widget.LinearLayout.LayoutParams(margin));

      var ripple = new android.graphics.drawable.RippleDrawable(android.content.res.ColorStateList.valueOf(android.graphics.Color.GRAY), new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[0])), null);
      btns[i].setBackgroundDrawable(ripple);

      btns[i].setOnClickListener(new android.view.View.OnClickListener({
        onClick: function(v) {
          switch (v.getId()) {
            case 0:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              toast("어떤 블럭으로 채우시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (selectedItemId != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "채우기";
              savedCommand = selectedCommand;
              break;

            case 1:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "비우기";
              savedCommand = selectedCommand;
              break;

            case 2:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              toast("어떤 블럭을 바꾸시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (selectedItemId == null) return;

                  blockId = selectedItemId;
                  blockData = selectedItemData;

                  showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
                  toast("어떤 블럭으로 바꾸시겠습니까?");

                  GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                    onDismiss: function() {
                      if (selectedItemId == null) {
                        blockId = null;
                        blockData = null;
                        return;
                      }

                      block2Id = selectedItemId;
                      block2Data = selectedItemData;

                      commandDetector = true;

                      selectedItemId = null;
                      selectedItemData = null;
                      GUIWindow.setOnDismissListener(null);
                    }
                  }));
                }
              }));
              selectedCommand = "바꾸기";
              savedCommand = selectedCommand;
              break;

            case 3:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              toast("어떤 블럭을 남기시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (selectedItemId == null) return;

                  blockId = selectedItemId;
                  blockData = selectedItemData;

                  showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
                  toast("어떤 블럭으로 바꾸시겠습니까?");

                  GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                    onDismiss: function() {
                      if (selectedItemId == null) {
                        blockId = null;
                        blockData = null;
                        return;
                      }

                      block2Id = selectedItemId;
                      block2Data = selectedItemData;

                      commandDetector = true;

                      selectedItemId = null;
                      selectedItemData = null;
                      GUIWindow.setOnDismissListener(null);
                    }
                  }));
                }
              }));
              selectedCommand = "남기기";
              savedCommand = selectedCommand;
              break;

            case 4:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              toast("어떤 블럭으로 벽을 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (selectedItemId != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "벽";
              savedCommand = selectedCommand;
              break;

            case 5:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 구를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "구";
              savedCommand = selectedCommand;
              break;

            case 6:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 반구를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "반구";
              savedCommand = selectedCommand;
              break;

            case 7:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 빈구를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "빈구";
              savedCommand = selectedCommand;
              break;

            case 8:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 빈반구를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "빈반구";
              savedCommand = selectedCommand;
              break;

            case 9:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 역 반구를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "역_반구";
              savedCommand = selectedCommand;
              break;

            case 10:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 역 빈반구를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "역_빈반구";
              savedCommand = selectedCommand;
              break;

            case 11:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              heightSetDialog();
              toast("어떤 블럭으로 원기둥을 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "원기둥";
              savedCommand = selectedCommand;
              break;

            case 12:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              heightSetDialog();
              toast("어떤 블럭으로 빈원기둥을 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "빈원기둥";
              savedCommand = selectedCommand;
              break;

            case 13:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              heightSetDialog();
              toast("어떤 블럭으로 피라미드를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (heightNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "피라미드";
              savedCommand = selectedCommand;
              break;

            case 14:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              heightSetDialog();
              toast("어떤 블럭으로 빈피라미드를 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (heightNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "빈피라미드";
              savedCommand = selectedCommand;
              break;

            case 15:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "회전_90도";
              savedCommand = selectedCommand;
              break;

            case 16:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "회전_180도";
              savedCommand = selectedCommand;
              break;

            case 17:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "회전_270도";
              savedCommand = selectedCommand;
              break;

            case 18:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "X축_대칭";
              savedCommand = selectedCommand;
              break;

            case 19:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "Y축_대칭";
              savedCommand = selectedCommand;
              break;

            case 20:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "Z축_대칭";
              savedCommand = selectedCommand;
              break;

            case 21:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "흡수";
              savedCommand = selectedCommand;
              break;

            case 22:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "복사";
              minPoint = comparePoint(0);
              maxPoint = comparePoint(1);
              savedCommand = selectedCommand;
              break;

            case 23:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "붙여넣기";
              savedCommand = selectedCommand;
              break;

            case 24:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 원을 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "원";
              savedCommand = selectedCommand;
              break;

            case 25:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              radiusSetDialog();
              toast("어떤 블럭으로 빈원을 생성하시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (radiusNum != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "빈원";
              savedCommand = selectedCommand;
              break;

            case 26:
              closeWindow(windows.cmd);
              showWindow(GUIWindow, android.view.Gravity.CENTER, 0, 0);
              toast("어떤 블럭으로 덮으시겠습니까?");

              GUIWindow.setOnDismissListener(new android.widget.PopupWindow.OnDismissListener({
                onDismiss: function() {
                  if (selectedItemId != null) commandDetector = true;
                  GUIWindow.setOnDismissListener(null);
                }
              }));
              selectedCommand = "덮기";
              savedCommand = selectedCommand;
              break;

            case 27:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "위로_이동";
              savedCommand = selectedCommand;
              break;

            case 28:
              closeWindow(windows.cmd);
              commandDetector = true;
              selectedCommand = "쌓기";
              minPoint = comparePoint(0);
              maxPoint = comparePoint(1);
              savedCommand = selectedCommand;
              break;
          }
        }
      }));

      btns[i].setOnLongClickListener(new android.view.View.OnLongClickListener({
        onLongClick: function(v) {
          switch (v.getId()) {
            case 0:
              showDialog("[HELP] 채우기", "지정된 영역을 원하는 블럭으로 채웁니다.");
              return true;
              break;

            case 1:
              showDialog("[HELP] 비우기", "지정된 영역을 비웁니다.");
              return true;
              break;

            case 2:
              showDialog("[HELP] 바꾸기", "첫번째로 선택한 블럭을 두번째로 선택한 블럭으로 바꿉니다.");
              return true;
              break;

            case 3:
              showDialog("[HELP] 남기기", "첫번째로 선택한 블럭을 제외한 모든 블럭을 두번째로 선택한 블럭으로 바꿉니다.");
              return true;
              break;

            case 4:
              showDialog("[HELP] 벽", "지정된 영역에서 벽을 생성합니다.");
              return true;
              break;

            case 5:
              showDialog("[HELP] 구", "플레이어 좌표를 기점으로 구를 생성힙니다.");
              return true;
              break;

            case 6:
              showDialog("[HELP] 반구", "플레이어 좌표를 기점으로 반구를 생성힙니다.");
              return true;
              break;

            case 7:
              showDialog("[HELP] 빈구", "플레이어 좌표를 기점으로 빈구를 생성힙니다.");
              return true;
              break;

            case 8:
              showDialog("[HELP] 빈반구", "플레이어 좌표를 기점으로 빈반구를 생성힙니다.");
              return true;
              break;

            case 9:
              showDialog("[HELP] 역 반구", "플레이어 좌표를 기점으로 역 반구를 생성힙니다.");
              return true;
              break;

            case 10:
              showDialog("[HELP] 역 빈반구", "플레이어 좌표를 기점으로 역 빈반구를 생성힙니다.");
              return true;
              break;

            case 11:
              showDialog("[HELP] 원기둥", "플레이어 좌표를 기점으로 원기둥을 생성힙니다.");
              return true;
              break;

            case 12:
              showDialog("[HELP] 빈원기둥", "플레이어 좌표를 기점으로 빈원기둥을 생성힙니다.");
              return true;
              break;

            case 13:
              showDialog("[HELP] 피라미드", "플레이어 좌표를 기점으로 피라미드를 생성힙니다.");
              return true;
              break;

            case 14:
              showDialog("[HELP] 빈피라미드", "플레이어 좌표를 기점으로 빈피라미드를 생성힙니다.");
              return true;
              break;

            case 15:
              showDialog("[HELP] 회전 90도", "클립보드에 저장되어 있는 블럭을 90도 회전합니다.");
              return true;
              break;

            case 16:
              showDialog("[HELP] 회전 180도", "클립보드에 저장되어 있는 블럭을 180도 회전합니다.");
              return true;
              break;

            case 17:
              showDialog("[HELP] 회전 270도", "클립보드에 저장되어 있는 블럭을 270도 회전합니다.");
              return true;
              break;

            case 18:
              showDialog("[HELP] X축 대칭", "지정된 영역에 있는 블럭을 X축 방향으로 대칭시킵니다.");
              return true;
              break;

            case 19:
              showDialog("[HELP] Y축 대칭", "지정된 영역에 있는 블럭을 Y축 방향으로 대칭시킵니다.");
              return true;
              break;

            case 20:
              showDialog("[HELP] Z축 대칭", "지정된 영역에 있는 블럭을 Z축 방향으로 대칭시킵니다.");
              return true;
              break;

            case 21:
              showDialog("[HELP] 흡수", "지정된 영역에 있는 물과 용암을 제거합니다.");
              return true;
              break;

            case 22:
              showDialog("[HELP] 복사", "지정된 영역에 있는 모든 블럭을 클립보드에 저장합니다.");
              return true;
              break;

            case 23:
              showDialog("[HELP] 붙여넣기", "클립보드에 저장되어 있는 블럭을 붙여넣습니다.");
              return true;
              break;

            case 24:
              showDialog("[HELP] 원", "플레이어 좌표를 기점으로 원을 생성힙니다.");
              return true;
              break;

            case 25:
              showDialog("[HELP] 빈원", "플레이어 좌표를 기점으로 빈원을 생성힙니다.");
              return true;
              break;

            case 26:
              showDialog("[HELP] 덮기", "지정된 영역내 블럭의 표면 위에 원하는 블럭으로 덮는 기능입니다.");
              return true;
              break;

            case 27:
              showDialog("[HELP] 위로 이동", "원하는 높이만큼 위로 이동합니다.");
              return true;
              break;

            case 28:
              showDialog("[HELP] 쌓기", "지정된 영역을 원하는 높이만큼 쌓아줍니다.");
              return true;
              break;
          }
        }
      }));
      layout.addView(btns[i]);
    }

    var scroll = new android.widget.ScrollView(ctx);
    scroll.addView(layout);

    windows.cmd.setContentView(scroll);
    windows.cmd.setFocusable(true);
    windows.cmd.setWidth(ctx.getWindowManager().getDefaultDisplay().getWidth() * 2 / 3);
    windows.cmd.setHeight(ctx.getWindowManager().getDefaultDisplay().getHeight() * 9 / 10);
    windows.cmd.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[1])));
    windows.cmd.setAnimationStyle(android.R.style.Animation_Dialog);
    windows.cmd.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.CENTER | android.view.Gravity.CENTER, 0, 0);
  } catch (e) {
    clientMessage(e + ", " + e.lineNumber);
  }
}


/**
 * commandHandler
 * Made by Irenebode
 * Thanks ToonRaon
 * Since 171217
 */
function commandHandler(command) {
  try {
    switch (command) {
      case "채우기":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        if (continueCommand) {
          progressShow("블럭을 생성 중입니다..");
          worldEditCmds[2].func(worldEditMemory.pos1, worldEditMemory.pos2, savedItemId, savedItemData);
          continueCommand = false;
          progressDismiss();
          break;
        }
        progressShow("블럭을 생성 중입니다..");
        worldEditCmds[2].func(worldEditMemory.pos1, worldEditMemory.pos2, selectedItemId, selectedItemData);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("채우기");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "비우기":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("블럭을 비우는 중입니다..");
        worldEditCmds[3].func(worldEditMemory.pos1, worldEditMemory.pos2);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("비우기");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "바꾸기":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("블럭을 바꾸는 중입니다..");
        worldEditCmds[4].func(worldEditMemory.pos1, worldEditMemory.pos2, blockId, blockData, block2Id, block2Data);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("바꾸기");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "남기기":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("블럭을 남기는 중입니다..");
        worldEditCmds[5].func(worldEditMemory.pos1, worldEditMemory.pos2, blockId, blockData, block2Id, block2Data);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("남기기");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "벽":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("벽을 생성 중입니다..");
        worldEditCmds[6].func(worldEditMemory.pos1, worldEditMemory.pos2, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("벽");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "구":
        progressShow("구를 생성 중입니다..");
        worldEditCmds[9].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("구");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "반구":
        progressShow("반구를 생성 중입니다..");
        worldEditCmds[10].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("반구");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "빈구":
        progressShow("빈구를 생성 중입니다..");
        worldEditCmds[11].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("빈구");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "빈반구":
        progressShow("빈반구를 생성 중입니다..");
        worldEditCmds[12].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("빈반구");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "역_반구":
        progressShow("역 반구를 생성 중입니다..");
        worldEditCmds[13].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("역\n반구");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "역_빈반구":
        progressShow("역 빈반구를 생성 중입니다..");
        worldEditCmds[14].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("역빈\n반구");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "원기둥":
        progressShow("원기둥을 생성 중입니다..");
        worldEditCmds[15].func(radiusNum, heightNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("원기둥");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "빈원기둥":
        progressShow("빈원기둥을 생성 중입니다..");
        worldEditCmds[16].func(radiusNum, heightNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("빈원\n기둥");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "피라미드":
        progressShow("피라미드를 생성 중입니다..");
        worldEditCmds[17].func(heightNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("피라\n미드");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "빈피라미드":
        progressShow("빈피라미드를 생성 중입니다..");
        worldEditCmds[18].func(heightNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("빈피\n라미드");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "회전_90도":
        progressShow("클립보드에 저장된 블럭을 90도 만큼 회전시키는 중입니다..");
        degreeNum = 90;
        worldEditCmds[21].func(90);
        degreeNum = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("회전\n90도");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "회전_180도":
        progressShow("클립보드에 저장된 블럭을 180도 만큼 회전시키는 중입니다..");
        degreeNum = 180;
        worldEditCmds[21].func(180);
        degreeNum = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("회전\n180도");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "회전_270도":
        progressShow("클립보드에 저장된 블럭을 270도 만큼 회전시키는 중입니다..");
        degreeNum = 270;
        worldEditCmds[21].func(270);
        degreeNum = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("회전\n270도");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "X축_대칭":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("지정된 영역에 있는 블럭을 X축 대칭시키는 중입니다..");
        worldEditCmds[27].func(worldEditMemory.pos1, worldEditMemory.pos2);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("X축\n대칭");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "Y축_대칭":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("지정된 영역에 있는 블럭을 Y축 대칭시키는 중입니다..");
        worldEditCmds[22].func(worldEditMemory.pos1, worldEditMemory.pos2);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("Y축\n대칭");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "Z축_대칭":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("지정된 영역에 있는 블럭을 Z축 대칭시키는 중입니다..");
        worldEditCmds[28].func(worldEditMemory.pos1, worldEditMemory.pos2);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("Z축\n대칭");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "흡수":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("지정된 영역 안의 액체류를 흡수하는 중입니다..");
        worldEditCmds[23].func(worldEditMemory.pos1, worldEditMemory.pos2);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("흡수");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "복사":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("지정된 영역을 클립보드에 저장 중입니다..");
        worldEditCmds[0].func(minPoint, maxPoint);
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("복사");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "붙여넣기":
        progressShow("클립보드에 저장된 블럭을 붙여넣는 중입니다..");
        worldEditCmds[1].func();
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("붙여\n넣기");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "원":
        progressShow("원을 생성 중입니다..");
        worldEditCmds[7].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("원");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "빈원":
        progressShow("빈원을 생성 중입니다..");
        worldEditCmds[8].func(radiusNum, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("빈원");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "덮기":
        if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
          clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
          break;
        }
        progressShow("지정된 영역을 덮는 중입니다..");
        worldEditCmds[20].func(worldEditMemory.pos1, worldEditMemory.pos2, selectedItemId, selectedItemData);
        selectedItemId = null;
        selectedItemData = null;
        progressDismiss();

        ctx.runOnUiThread(new java.lang.Runnable({
          run: function() {
            try {
              contiBtn.setText("덮기");
            } catch (e) {
              clientMessage(e + ", " + e.lineNumber);
            }
          }
        }));
        break;

      case "위로_이동":
        moveUp();
        break;

      case "되돌리기":
        progressShow("지정된 영역을 복원하는 중입니다..");
        worldEditCmds[24].func();
        progressDismiss();
        break;

      case "다시실행":
        progressShow("지정된 영역을 복원하는 중입니다..");
        worldEditCmds[25].func();
        progressDismiss();
        break;

      case "쌓기":
        stackDialog();
        break;
    }
  } catch (e) {
    clientMessage(e + ", " + e.lineNumber);
  }
}


function moveUp() {
  var dialog;

  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var upNum = 0;

        var editText = new android.widget.EditText(ctx);
        editText.setHint("높이를 입력하세요..");
        editText.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        dialog = new android.app.AlertDialog.Builder(ctx, 5);
        dialog.setTitle("이동 높이 설정");
        dialog.setView(editText);
        dialog.setNegativeButton("취소", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            if (editText.getText() + "" == "") {
              toast("이동 높이가 설정되지않았습니다.");
              return;
            }
            upNum = parseInt(editText.getText() + "");
            worldEditCmds[19].func(upNum);
            ctx.runOnUiThread(new java.lang.Runnable({
              run: function() {
                try {
                  contiBtn.setText("위로\n이동");
                } catch (e) {
                  clientMessage(e + ", " + e.lineNumber);
                }
              }
            }));
          }
        }));
        dialog.setCancelable(false);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
  return dialog;
}


function stackDialog() {
  if (worldEditMemory.pos1[0] == null || worldEditMemory.pos2[0] == null) {
    clientMessage(ChatColor.RED + "먼저 나무도끼로 두 지점을 지정해주세요.");
    return;
  }

  var dialog;

  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var stackHeight = null;

        var editText = new android.widget.EditText(ctx);
        editText.setHint("높이를 입력하세요..");
        editText.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        dialog = new android.app.AlertDialog.Builder(ctx, 5);
        dialog.setTitle("높이 설정");
        dialog.setView(editText);
        dialog.setNegativeButton("취소", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            if (editText.getText() + "" == "") {
              toast("높이가 설정되지않았습니다.");
              return;
            }
            stackHeight = parseInt(editText.getText() + "");
            progressShow(stackHeight + "만큼 쌓아올리는 중입니다..");
            worldEditCmds[26].func(minPoint, maxPoint, stackHeight);
            progressDismiss();

            ctx.runOnUiThread(new java.lang.Runnable({
              run: function() {
                try {
                  contiBtn.setText("쌓기");
                } catch (e) {
                  clientMessage(e + ", " + e.lineNumber);
                }
              }
            }));
          }
        }));
        dialog.setCancelable(false);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
  return dialog;
}


/**
 * BlockImageLoader
 * Made by Irenebode
 * Thanks to ToonRaon
 * Since 171215
 */
function makeGUIWindow() {
  makeGUIWindowThread = new java.lang.Thread(new java.lang.Runnable() {
    run: function() {
      try {

        var rLayout = new android.widget.RelativeLayout(ctx);
        rLayout.setGravity(android.view.Gravity.CENTER);
        rLayout.setBackgroundColor(android.graphics.Color.argb(128, 0, 0, 0));

        var tableParams = new android.widget.RelativeLayout.LayoutParams(dip2px(630), dip2px(350));
        tableParams.setMargins(dip2px(5), dip2px(5), 0, 0);

        var table = new android.widget.ImageView(ctx);
        var source = new android.graphics.BitmapFactory.decodeFile(GUI_PATH + "/table.png");
        table.setImageBitmap(new android.graphics.Bitmap.createScaledBitmap(source, dip2px(630), dip2px(350), true));
        table.setId(1000);
        rLayout.addView(table, tableParams);

        var vLayout = new Array();

        // 아이템, 블럭 버튼 생성
        var files = getAllImageFiles(ITEM_PATH);
        var currentPage = 0;
        vLayout = makeItemButtons(files, rLayout, vLayout, currentPage);

        var ButtonOnClickListener = new android.view.View.OnClickListener({
          onClick: function(view) {
            switch (view) {
              case prevButton:
                if (currentPage == 0) return;

                vLayout[currentPage].setAlpha(0);
                vLayout[--currentPage].setAlpha(1);
                vLayout[currentPage].bringToFront();
                break;

              case nextButton:
                if (currentPage == Math.floor(files.length / 66)) return;

                vLayout[currentPage].setAlpha(0);
                vLayout[++currentPage].setAlpha(1);
                vLayout[currentPage].bringToFront();
                break;

              case closeButton:
                selectedItemId = null;
                selectedItemData = null;
                GUIWindow.dismiss();
                break;
            }

            pageText.setText((currentPage + 1) + "/" + (lastPage + 1));
          }
        });

        var lastPage = Math.floor(files.length / 66);

        var pageTextParams = new android.widget.RelativeLayout.LayoutParams(-2, -2);
        pageTextParams.addRule(android.widget.RelativeLayout.ALIGN_BOTTOM, 1000);
        pageTextParams.addRule(android.widget.RelativeLayout.ALIGN_RIGHT, 1000);
        pageTextParams.setMargins(0, 0, dip2px(60), dip2px(5));

        var pageText = new android.widget.TextView(ctx);
        pageText.setText((currentPage + 1) + "/" + (lastPage + 1));
        pageText.setTextSize(20);
        pageText.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        rLayout.addView(pageText, pageTextParams);

        // arrow buttons
        var arrowLayoutParams = new android.widget.RelativeLayout.LayoutParams(-2, -2);
        arrowLayoutParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
        arrowLayoutParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
        arrowLayoutParams.setMargins(0, 0, dip2px(3), dip2px(20));

        var arrowLayout = new android.widget.LinearLayout(ctx);
        arrowLayout.setOrientation(1);

        var arrowButtonParams = new android.widget.LinearLayout.LayoutParams(dip2px(40), dip2px(40));
        arrowButtonParams.setMargins(0, dip2px(10), 0, 0);

        var prevButton = new android.widget.Button(ctx);
        prevButton.setOnClickListener(ButtonOnClickListener);
        var prevButtonSource = new android.graphics.BitmapFactory.decodeFile(GUI_PATH + "/ic_previous.png");
        prevButton.setBackground(new android.graphics.drawable.BitmapDrawable(prevButtonSource));
        arrowLayout.addView(prevButton, arrowButtonParams);

        var nextButton = new android.widget.Button(ctx);
        nextButton.setOnClickListener(ButtonOnClickListener);
        var nextButtonSource = new android.graphics.BitmapFactory.decodeFile(GUI_PATH + "/ic_next.png");
        nextButton.setBackground(new android.graphics.drawable.BitmapDrawable(nextButtonSource));
        arrowLayout.addView(nextButton, arrowButtonParams);

        rLayout.addView(arrowLayout, arrowLayoutParams);

        // close button
        var closeLayout = android.widget.RelativeLayout(ctx);

        var closeLayoutParams = new android.widget.RelativeLayout.LayoutParams(-2, -2);
        closeLayoutParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_TOP);
        closeLayoutParams.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);

        var closeButtonParams = new android.widget.RelativeLayout.LayoutParams(dip2px(50), dip2px(50));

        var closeButton = new android.widget.Button(ctx);
        closeButton.setAlpha(0);
        closeButton.setOnClickListener(ButtonOnClickListener);
        closeLayout.addView(closeButton, closeButtonParams);

        rLayout.addView(closeLayout, closeLayoutParams);

        GUIWindow = new android.widget.PopupWindow(rLayout, -1, -1);
        GUIWindow.setFocusable(true);

        // toast("월드에딧을 사용할 준비가 완료되었습니다.");
      } catch (e) {
        toast("월드에딧 GUI를 불러오는 데 실패하였습니다.\n" + e + ", " + e.lineNumber);
      }
    }
  });
  makeGUIWindowThread.start();
}


function getAllImageFiles(path) {
  try {
    var files = new Array();
    var list = new java.io.File(path).list();

    files.push("");

    for each(var i in list) {
      if (i == ".nomedia") continue;
      files.push(i + "");
    }

    files.sort(function(a, b) {
      if (a.split("-")[0] != b.split("-")[0])
        return (parseInt(a.split("-")[0]) - parseInt(b.split("-")[0]));
      else
        return (parseInt(a.split("-")[1].split(".png")[0]) - parseInt(b.split("-")[1].split(".png")[0]));
    });

    return files;
  } catch (e) {
    toast("이미지를 불러오는 도중 오류가 발생하였습니다.\n" + e + ", " + e.lineNumber);
  }
}


function makeItemButtons(files, rLayout, vLayout, currentPage) {
  try {
    var vLayoutParams = new android.widget.RelativeLayout.LayoutParams(-2, -2);
    vLayoutParams.setMargins(dip2px(10), dip2px(15), 0, 0);

    var buttonParams = new android.widget.LinearLayout.LayoutParams(dip2px(50), dip2px(50));

    var itemButtonOnClickListener = new android.view.View.OnClickListener({
      onClick: function(view) {
        var fileName = files[parseInt(view.getId())];

        toast(fileName.replace("-", ":").replace(".png", ""));
        selectedItemId = parseInt(fileName.split("-")[0]);
        selectedItemData = parseInt(fileName.split("-")[1].split(".png")[0]);
        savedItemId = selectedItemId;
        savedItemData = selectedItemData;

        ctx.runOnUiThread(new java.lang.Runnable() {
          run: function() {
            GUIWindow.dismiss();
          }
        });

      }
    });

    var itemButtonOnLongClickListener = new android.view.View.OnLongClickListener({
      onLongClick: function(view) {
        var fileName = files[parseInt(view.getId())];
        var itemId = parseInt(fileName.split("-")[0]);
        var itemData = parseInt(fileName.split("-")[1].split(".png")[0]);

        if (itemId == 255) return; // 255 팅김 방지
        toast(fileName.replace("-", ":").replace(".png", ""));

        return true;
      }
    });

    for (var i = 0; i <= Math.floor(files.length / 66); i++) {

      vLayout.push(new android.widget.LinearLayout(ctx));
      vLayout[i].setOrientation(1);
      vLayout[i].setPadding(dip2px(10), dip2px(10), dip2px(10), 0);

      for (var j = 0; j <= 5; j++) {
        var hLayout = new android.widget.LinearLayout(ctx);
        hLayout.setOrientation(0);

        for (var k = 0; k <= 10; k++) {
          var itemLayout = new android.widget.RelativeLayout(ctx);

          var id = (i * 66) + (j * 11) + k + 1;
          var src = new android.graphics.BitmapFactory.decodeFile(ITEM_PATH + "/" + files[id]);

          var itemImage = new android.widget.ImageView(ctx);
          itemImage.setId(id);
          itemImage.setPadding(0, 0, 0, 0);
          if (files[id] != null) {
            if (new java.io.File(ITEM_PATH, files[id]).exists()) {
              itemImage.setImageBitmap(new android.graphics.Bitmap.createScaledBitmap(src, dip2px(50), dip2px(50), true));
            }

            itemImage.setOnLongClickListener(itemButtonOnLongClickListener);
            itemImage.setOnClickListener(itemButtonOnClickListener);
          } else {
            itemImage.setOnClickListener(null);
          }
          itemLayout.addView(itemImage, buttonParams);

          var itemTextLayoutParams = new android.widget.RelativeLayout.LayoutParams(-2, -2);
          itemTextLayoutParams.addRule(android.widget.RelativeLayout.ALIGN_RIGHT, id);
          itemTextLayoutParams.addRule(android.widget.RelativeLayout.ALIGN_BOTTOM, id);

          var itemText = new android.widget.TextView(ctx);
          itemText.setText((files[id] != null) ? files[id].replace("-", ":").replace(".png", "") : "");
          itemText.setTextSize(10);
          itemText.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
          itemText.setClickable(false);
          itemLayout.addView(itemText, itemTextLayoutParams);

          hLayout.addView(itemLayout);
        }

        vLayout[i].addView(hLayout);
        if (i != 0)
          vLayout[i].setAlpha(0);
      }

      rLayout.addView(vLayout[i], vLayoutParams);
    }
    vLayout[0].bringToFront();

    return vLayout;
  } catch (e) {
    toast("블럭이미지 버튼 생성 도중 오류가 발생했습니다.\n" + e + ", " + e.lineNumber);
    clientMessage(e + ", " + e.lineNumber);
  }
}


/**
 * Detail function of Num.1
 */

/**
 * 0.RoadMaker & 1.StairMaker
 * Made by Irenebode
 * Since 171009
 */
function int2deg(int) {
  return (int * Math.PI / 180);
}


function gauss(num) {
  if (num >= 0) return parseInt(num);
  else if (num < 0) return parseInt(num - 1);
}


var count = 0;
var roadCount = 0;
var stairCount = 0;
var isRoadMakerOn = false;
var isStairMakerOn = false;
var roadMakePos = new Array(3);
var stairMakePos = new Array(3);
var deltaX = 0;
var deltaY = 0;
var deltaZ = 0;

function initializeRoadMaker(x, y, z) {
  roadMakerPos = [gauss(x), y, gauss(z)];
  deltaX = 0;
  deltaZ = 0;
  isRoadMakerOn = true;
  toast("버튼을 한번 더 누르거나 장애물이 있을 경우 기능이 종료됩니다.");
}


function roadMaker(x, y, z, deltaX, deltaZ, block, blockData) {
  if (Level.getTile(x + deltaX, y, z + deltaZ) != 0 && (deltaX != 0 || deltaZ != 0)) {
    stopRoadMaker();
    return;
  }
  Level.setTile(x + deltaX, y, z + deltaZ, block, blockData);
}


function stopRoadMaker() {
  isRoadMakerOn = false;
  deltaX = 0;
  deltaZ = 0;
  toast("로드메이커가 종료되었습니다.");
}


function initializeStairMaker(x, y, z) {
  stairMakerPos = [gauss(x), y, gauss(z)];
  deltaX = 0;
  deltaY = 0;
  deltaZ = 0;
  isStairMakerOn = true;
  toast("버튼을 한번 더 누르거나 장애물이 있을 경우 기능이 종료됩니다.");
}


function stairMaker(x, y, z, deltaX, deltaY, deltaZ, block, blockData) {
  if (Level.getTile(x + deltaX, y + deltaY, z + deltaZ) != 0 && (deltaX != 0 || deltaZ != 0)) {
    stopStairMaker();
    return;
  }
  Level.setTile(x + deltaX, y + deltaY, z + deltaZ, block, blockData);
}


function stopStairMaker() {
  isStairMakerOn = false;
  deltaX = 0;
  deltaY = 0;
  deltaZ = 0;
  toast("계단메이커가 종료되었습니다.");
}


/**
 * 5.timeSet
 * Made by Irenebode
 * Since 171014
 */
var timeLock = false;
var timeLockData = null;

function timeSet() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var timeText = new android.widget.TextView(ctx);
        timeText.setText(" 시간 : " + Level.getTime());
        timeText.setTextSize(15);
        timeText.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        timeText.setGravity(android.view.Gravity.LEFT);
        layout.addView(timeText);

        var timeChange = new android.widget.SeekBar(ctx);
        timeChange.setMax(19200);
        if (Level.getTime() < 19201)
          timeChange.setProgress(Level.getTime());
        timeChange.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
          onProgressChanged: function(s) {
            timeText.setText(" 시간 : " + s.getProgress());
            Level.setTime(s.getProgress());
          }
        }));
        layout.addView(timeChange);

        var checkTimeLock = new android.widget.CheckBox(ctx);
        checkTimeLock.setText("시간 고정");
        checkTimeLock.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        checkTimeLock.setChecked(timeLock);
        checkTimeLock.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
          onCheckedChanged: function(check, isChecked) {
            if (isChecked) {
              timeLock = true;
              timeLockData = Level.getTime();
            } else {
              timeLock = false;
            }
          }
        }));
        layout.addView(checkTimeLock);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("시간 설정");
        dialog.setView(layout);
        dialog.setNegativeButton("닫기", null);
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 6.weatherSet
 * Made by Irenebode
 * Since 171226
 */
var weatherLock = false;
var weatherLockData = null;
var lightningLock = false;
var lightningLockData = null;

function weatherSet() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var weatherText = new android.widget.TextView(ctx);
        weatherText.setText(" 비(눈) : " + (Level.getRainLevel() / 100.0) * 100);
        weatherText.setTextSize(15);
        weatherText.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        weatherText.setGravity(android.view.Gravity.LEFT);
        layout.addView(weatherText);

        var weatherChange = new android.widget.SeekBar(ctx);
        weatherChange.setMax(100);
        if (Level.getRainLevel() * 100 < 101)
          weatherChange.setProgress(Level.getRainLevel() * 100);
        weatherChange.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
          onProgressChanged: function(s) {
            weatherText.setText(" 비/눈 : " + s.getProgress() / 100.0);
            Level.setRainLevel(s.getProgress() / 100.0);
          }
        }));
        layout.addView(weatherChange);

        var lightingText = new android.widget.TextView(ctx);
        lightingText.setText(" 번개 : " + (Level.getLightningLevel() / 100.0) * 100);
        lightingText.setTextSize(15);
        lightingText.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        lightingText.setGravity(android.view.Gravity.LEFT);
        layout.addView(lightingText);

        var lightingChange = new android.widget.SeekBar(ctx);
        lightingChange.setMax(100);
        if (Level.getLightningLevel() * 100 < 101)
          lightingChange.setProgress(Level.getLightningLevel() * 100);
        lightingChange.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
          onProgressChanged: function(s) {
            lightingText.setText(" 번개 : " + s.getProgress() / 100.0);
            Level.setLightningLevel(s.getProgress() / 100.0);
          }
        }));
        layout.addView(lightingChange);

        var checkWeatherLock = new android.widget.CheckBox(ctx);
        checkWeatherLock.setText("날씨 고정");
        checkWeatherLock.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        checkWeatherLock.setChecked(weatherLock);
        checkWeatherLock.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
          onCheckedChanged: function(check, isChecked) {
            if (isChecked) {
              weatherLock = true;
              weatherLockData = Level.getRainLevel();
              lightningLock = true;
              lightningLockData = Level.getLightningLevel();
            } else {
              weatherLock = false;
              lightningLock = false;
            }
          }
        }));
        layout.addView(checkWeatherLock);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("날씨 설정");
        dialog.setView(layout);
        dialog.setNegativeButton("닫기", null);
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 7.Tutorial
 * Made by Irenebode
 * Since 171224
 */
function tutorialDialog() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);

        dialog.setMessage(
          "본 월드에딧 스크립트는 여러분이 건축을 좀 더 쉽고 편하고 빠르게 하실 수 있도록 도와줍니다.\n" +
          "\n" +
          "우선, 가장 대표적인 기능인 '채우기' 기능에 대해서만 알려드리겠습니다.\n" +
          "\n" +
          "먼저, 화면의 오른쪽에 있는 단축버튼들 중 '나무도끼' 버튼을 누르면 나무도끼 아이템이 생깁니다.\n" +
          "나무도끼로 블럭을 터치하면 해당 블럭의 좌표가 '지점1' 로 설정됩니다.\n" +
          "그리고 나무도끼로 다른 블럭을 꾹 누르고 있으면 '지점2' 로 설정됩니다.\n" +
          "\n" +
          "이제 범위 설정이 완료되었습니다.\n" +
          "이 상태에서 화면의 오른쪽에 있는 단축버튼들 중 'cmd' 버튼을 누르면 원하는 명령어를 선택할 수 있는 화면이 나옵니다.\n" +
          "일단 채우기 기능에 대해 알아보고 있으니 '채우기' 버튼을 누르면,\n" +
          "어떠한 블럭으로 채우고 싶은지 물어보며, 원하는 블럭을 선택할 수 있습니다.\n" +
          "만약 하얀양털를 선택했다면, 지정한 영역의 블럭들이 모두 하얀양털(35:0)로 바뀝니다.\n" +
          "\n" +
          "'채우기' 외에 다른 명령어을 사용하고 싶다면 'cmd' 버튼을 누르면 나오는 메뉴에서\n" +
          "자신이 원하는 명령어를 길게 눌러보면 해당 명령어에 대한 설명을 간략히 해줍니다.\n" +
          "\n" +
          "튜토리얼은 화면의 오른쪽 위에 있는 메인버튼 메뉴 아래에서 계속해서 볼 수 있습니다.\n" +
          "그럼 행운을 빕니다."
        );

        dialog.setTitle("튜토리얼");
        dialog.setNegativeButton("닫기", null);
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 9.entitySet
 * Made by Irenebode
 * Since 171030
 */
var entities = new Array();

var entityInfo = [{
    name: "닭",
    code: 10
  },
  {
    name: "소",
    code: 11
  },
  {
    name: "돼지",
    code: 12
  },
  {
    name: "양",
    code: 13
  },
  {
    name: "늑대",
    code: 14
  },
  {
    name: "주민",
    code: 15
  },
  {
    name: "버섯소",
    code: 16
  },
  {
    name: "오징어",
    code: 17
  },
  {
    name: "토끼",
    code: 18
  },
  {
    name: "박쥐",
    code: 19
  },
  {
    name: "철골렘",
    code: 20
  },
  {
    name: "눈사람",
    code: 21
  },
  {
    name: "오셀롯",
    code: 22
  },
  {
    name: "말",
    code: 23
  },
  {
    name: "당나귀",
    code: 24
  },
  {
    name: "노새",
    code: 25
  },
  {
    name: "스켈레톤 말",
    code: 26
  },
  {
    name: "좀비 말",
    code: 27
  },
  {
    name: "북극곰",
    code: 28
  },
  {
    name: "라마",
    code: 29
  },
  {
    name: "앵무새",
    code: 30
  },
  {
    name: "좀비",
    code: 32
  },
  {
    name: "크리퍼",
    code: 33
  },
  {
    name: "스켈레톤",
    code: 34
  },
  {
    name: "거미",
    code: 35
  },
  {
    name: "좀비 피그맨",
    code: 36
  },
  {
    name: "슬라임",
    code: 37
  },
  {
    name: "엔더맨",
    code: 38
  },
  {
    name: "좀벌레",
    code: 39
  },
  {
    name: "동굴거미",
    code: 40
  },
  {
    name: "가스트",
    code: 41
  },
  {
    name: "마그마 큐브",
    code: 42
  },
  {
    name: "블레이즈",
    code: 43
  },
  {
    name: "주민좀비",
    code: 44
  },
  {
    name: "마녀",
    code: 45
  },
  {
    name: "야생동물",
    code: 46
  },
  {
    name: "허스크",
    code: 47
  },
  {
    name: "위더 스켈레톤",
    code: 48
  },
  {
    name: "가디언",
    code: 49
  },
  {
    name: "엘더 가디언",
    code: 50
  },
  {
    name: "위더",
    code: 52
  },
  {
    name: "엔더 드래곤",
    code: 53
  },
  {
    name: "셜커",
    code: 54
  },
  {
    name: "엔더 진드기",
    code: 55
  },
  {
    name: "변명자",
    code: 57
  },
  {
    name: "갑옷 거치대",
    code: 61
  },
  {
    name: "드롭된 아이템",
    code: 64
  },
  {
    name: "활성화 된 TNT",
    code: 65
  },
  {
    name: "떨어지는 아이템",
    code: 66
  },
  {
    name: "인첸트 병",
    code: 68
  },
  {
    name: "경험치",
    code: 69
  },
  {
    name: "엔더의 눈",
    code: 70
  },
  {
    name: "엔더 수정",
    code: 71
  },
  {
    name: "폭죽 로켓",
    code: 72
  },
  {
    name: "셜커 총알",
    code: 76
  },
  {
    name: "낚시 찌",
    code: 77
  },
  {
    name: "드래곤 화염구",
    code: 79
  },
  {
    name: "화살",
    code: 80
  },
  {
    name: "눈덩이",
    code: 81
  },
  {
    name: "달걀",
    code: 82
  },
  {
    name: "그림",
    code: 83
  },
  {
    name: "마인카트",
    code: 84
  },
  {
    name: "가스트 화염구",
    code: 85
  },
  {
    name: "던져진 물약(포션)",
    code: 86
  },
  {
    name: "던져진 엔더진주",
    code: 87
  },
  {
    name: "매듭",
    code: 88
  },
  {
    name: "위더 머리",
    code: 89
  },
  {
    name: "보트",
    code: 90
  },
  {
    name: "푸른 위더 머리",
    code: 91
  },
  {
    name: "번개",
    code: 93
  },
  {
    name: "블레이즈 화염구",
    code: 94
  },
  {
    name: "포션효과 구름",
    code: 95
  },
  {
    name: "깔때기 마인카트",
    code: 96
  },
  {
    name: "TNT 마인카트",
    code: 97
  },
  {
    name: "상자 마인카트",
    code: 98
  },
  {
    name: "커맨드블럭",
    code: 100
  },
  {
    name: "떨어지는 오래가는 포션",
    code: 101
  },
  {
    name: "라마의 침",
    code: 102
  },
  {
    name: "소환사의 덫",
    code: 103
  },
  {
    name: "우민 소환사",
    code: 104
  },
  {
    name: "벡스",
    code: 105
  }
];

var entityManager = {
  spawn: new Array(),
  remove: new Array(),
  getEntityAmounts: function() {
    var entitiesLength = entities.length;
    var amounts = new Array(81);
    for (var i = 0; i < entityInfo.length; i++) {
      amounts[i] = new Object();
      amounts[i].name = entityInfo[i].name;
      amounts[i].amount = 0;
      for (var i2 = 0; i2 < entitiesLength; i2++) {
        if (entityInfo[i].code == Entity.getEntityTypeId(entities[i2])) {
          amounts[i].amount++;
        }
      }
    }
    return amounts;
  },
  removeEntity: function(code) {
    var entitiesLength = entities.length;
    for (var i = 0; i < entitiesLength; i++) {
      if (code == -1) {
        Entity.remove(entities[i]);
      } else
      if (Entity.getEntityTypeId(entities[i]) == code) {
        Entity.remove(entities[i]);
      }
    }
  }
};

var antiEnt = false;

var entNow = false;
var entType1 = false;
var entType2 = false;

function entityMain() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var entList = new android.widget.LinearLayout(ctx);
        entList.setOrientation(1);

        var hideEntNow = new android.widget.CheckBox(ctx);
        hideEntNow.setText("현재 엔티티 목록 숨기기");
        hideEntNow.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        hideEntNow.setChecked(entNow);
        hideEntNow.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
          onCheckedChanged: function(check, isChecked) {
            if (isChecked) {
              entNow = true;
              layout.removeView(entList);
            } else {
              entNow = false;
              layout.addView(entList, 1);
            }
          }
        }));
        layout.addView(hideEntNow);

        var amounts = entityManager.getEntityAmounts();
        var string = "";
        for (var i = 0; i < amounts.length; i++) {
          if (amounts[i].amount != 0) {
            string += amounts[i].name + " : " +
              amounts[i].amount + "\n";
          }
        }

        if (!entNow) layout.addView(entList);

        var entText = new android.widget.TextView(ctx);
        entText.setText(string);
        entText.setTextSize(15);
        entText.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        entText.setGravity(android.view.Gravity.LEFT);
        entList.addView(entText);

        var antiEntity = new android.widget.CheckBox(ctx);
        antiEntity.setText("엔티티 소환 방지");
        antiEntity.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        antiEntity.setChecked(antiEnt);
        antiEntity.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
          onCheckedChanged: function(check, isChecked) {
            if (isChecked) {
              antiEnt = true;
              toast("플레이어와 그림은 예외입니다.");
            } else {
              antiEnt = false;
            }
          }
        }));
        layout.addView(antiEntity);

        var btns = [];
        var menus = ["엔티티 소환", "엔티티 제거", "모든 엔티티 제거"];

        for (var i in menus) {
          btns[i] = new android.widget.Button(ctx);
          btns[i].setText(menus[i]);
          btns[i].setTextSize(15);
          btns[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
          btns[i].setId(i);

          btns[i].setLayoutParams(new android.widget.LinearLayout.LayoutParams(margin));
          btns[i].setOnClickListener(new android.view.View.OnClickListener({
            onClick: function(v) {
              switch (v.getId()) {
                case 0:
                  spawnEntityMenu();
                  break;

                case 1:
                  removeEntityMenu();
                  break;

                case 2:
                  for each(var e in Entity.getAll()) {
                    if (!(Player.isPlayer(e) || Entity.getEntityTypeId(e) == 83)) Entity.remove(e);
                  }
                  toast("플레이어와 그림을 제외한 모든 엔티티가 제거되었습니다.");
                  break;
              }
            }
          }));
          layout.addView(btns[i]);
        }

        var scroll = android.widget.ScrollView(ctx);
        scroll.addView(layout);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("엔티티 관리");
        dialog.setView(scroll);
        dialog.setNegativeButton("닫기", null);
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


function spawnEntityMenu() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var entList = new android.widget.LinearLayout(ctx);
        entList.setOrientation(1);

        var hideEntType = new android.widget.CheckBox(ctx);
        hideEntType.setText("엔티티 목록 숨기기");
        hideEntType.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        hideEntType.setChecked(entType1);
        hideEntType.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
          onCheckedChanged: function(check, isChecked) {
            if (isChecked) {
              entType1 = true;
              layout.removeView(entList);
            } else {
              entType1 = false;
              layout.addView(entList, 1);
            }
          }
        }));
        layout.addView(hideEntType);

        var checkBox = [];
        for (var i = 0; i < entityInfo.length; i++) {
          checkBox[i] = new android.widget.CheckBox(ctx);
          checkBox[i].setText(entityInfo[i].name);
          checkBox[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
          checkBox[i].setId(entityInfo[i].code);
          entList.addView(checkBox[i]);
        }

        if (!entType1) layout.addView(entList);

        var pos = new android.widget.TextView(ctx);
        pos.setText("좌표 : ");
        pos.setTextSize(15);
        pos.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        pos.setGravity(android.view.Gravity.LEFT);
        layout.addView(pos);

        var x = new android.widget.TextView(ctx);
        x.setText("X : ");
        x.setTextSize(15);
        x.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));

        var editX = new android.widget.EditText(ctx);
        editX.setText(Player.getX() + "");
        editX.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        editX.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        layout.addView(makeCoordInput(x, editX));

        var y = new android.widget.TextView(ctx);
        y.setText("Y : ");
        y.setTextSize(15);
        y.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));

        var editY = new android.widget.EditText(ctx);
        editY.setText(Player.getY() + "");
        editY.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        editY.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        layout.addView(makeCoordInput(y, editY));

        var z = new android.widget.TextView(ctx);
        z.setText("Z : ");
        z.setTextSize(15);
        z.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));

        var editZ = new android.widget.EditText(ctx);
        editZ.setText(Player.getZ() + "");
        editZ.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        editZ.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        layout.addView(makeCoordInput(z, editZ));

        var amount = new android.widget.TextView(ctx);
        amount.setText("수량 : ");
        amount.setTextSize(15);
        amount.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));

        var editAmount = new android.widget.EditText(ctx);
        editAmount.setText("1");
        editAmount.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        editAmount.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);

        layout.addView(makeCoordInput(amount, editAmount));

        var ok = new android.widget.Button(ctx);
        ok.setText("확인");
        ok.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        ok.setOnClickListener(new android.view.View.OnClickListener({
          onClick: function(v) {
            for (u = 0; u < checkBox.length; u++) {
              if (checkBox[u].isChecked()) {
                entityManager.spawn.push([checkBox[u].getId(), editX.getText(), editY.getText(), editZ.getText(), editAmount.getText()]);
              }
            }
          }
        }));
        layout.addView(ok);

        var scroll = android.widget.ScrollView(ctx);
        scroll.addView(layout);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("엔티티 소환");
        dialog.setView(scroll);
        dialog.setNegativeButton("닫기", null);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


function removeEntityMenu() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var entList = new android.widget.LinearLayout(ctx);
        entList.setOrientation(1);

        var hideEntType = new android.widget.CheckBox(ctx);
        hideEntType.setText("엔티티 목록 숨기기");
        hideEntType.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        hideEntType.setChecked(entType2);
        hideEntType.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
          onCheckedChanged: function(check, isChecked) {
            if (isChecked) {
              entType2 = true;
              layout.removeView(entList);
            } else {
              entType2 = false;
              layout.addView(entList, 1);
            }
          }
        }));
        layout.addView(hideEntType);

        var checkBox = [];
        for (var i = 0; i < entityInfo.length; i++) {
          checkBox[i] = new android.widget.CheckBox(ctx);
          checkBox[i].setText(entityInfo[i].name);
          checkBox[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
          checkBox[i].setId(entityInfo[i].code);
          entList.addView(checkBox[i]);
        }

        if (!entType2) layout.addView(entList);

        var ok = new android.widget.Button(ctx);
        ok.setText("확인");
        ok.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        ok.setOnClickListener(new android.view.View.OnClickListener({
          onClick: function(v) {
            for (u = 0; u < checkBox.length; u++) {
              if (checkBox[u].isChecked()) {
                entityManager.remove.push(checkBox[u].getId());
              }
            }
          }
        }));
        layout.addView(ok);

        var scroll = android.widget.ScrollView(ctx);
        scroll.addView(layout);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("엔티티 제거");
        dialog.setView(scroll);
        dialog.setNegativeButton("닫기", null);
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 10.gameSpeedSet
 * Made by Irenebode
 * Since 171102
 */
var currentGameSpeed = 20;

function gameSpeedSet() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var gameSpeed = new android.widget.TextView(ctx);
        gameSpeed.setText(" 게임속도 : " + currentGameSpeed * 5 + "%");
        gameSpeed.setTextSize(15);
        gameSpeed.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        gameSpeed.setGravity(android.view.Gravity.LEFT);
        layout.addView(gameSpeed);

        var gameSpeedSeekBar = new android.widget.SeekBar(ctx);
        gameSpeedSeekBar.setProgress(currentGameSpeed * 100 / (20 * 4));
        gameSpeedSeekBar.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
          onProgressChanged: function(seekbar, progress, fromUser) {
            ModPE.setGameSpeed(progress * 20 * 4 / 100);
            currentGameSpeed = progress * 20 * 4 / 100;
            gameSpeed.setText(" 게임속도 : " + currentGameSpeed * 5 + "%");
          }
        }));
        layout.addView(gameSpeedSeekBar);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("게임속도 조정");
        dialog.setView(layout);
        dialog.setNegativeButton("닫기", null);
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 11. imageViewer
 * Made by Irenebode
 * Since 180103
 */
var result = IMAGE_PATH + "/no_image.png";

function makeFileChooser(path) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx);
        dialog.setTitle(path);
        var files = getFiles(new java.io.File(path).listFiles());
        dialog.setItems(files, new android.content.DialogInterface.OnClickListener({
          onClick: function(d, i) {
            var clicked = path + "/" + files[i];
            if (new java.io.File(clicked).isDirectory()) makeFileChooser(clicked);
            else if (new java.io.File(clicked).isFile()) {
              result = clicked;
              imageViewer();
            }
          }
        }));
        if (path.split("/").length > 4) {
          dialog.setNegativeButton("상위", new android.content.DialogInterface.OnClickListener({
            onClick: function() {
              makeFileChooser(new java.io.File(path).getParent());
            }
          }));
        }
        dialog.setNegativeButton("취소", null);
        dialog.show();
      } catch (e) {
        print(e);
      }
    }
  }));
}


function getFiles(f) {
  var list = [];
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      for (var i = 0; i < f.length; i++) list[i] = f[i].getName();
      list.sort();
    }
  }));
  return list;
}


var imageViewerLayout;

function imageViewer() {
  imageViewerLayout = new android.widget.RelativeLayout(ctx);
  windows.imageViewerWindow = new android.widget.PopupWindow(imageViewerLayout, -2, -2);

  var imageViewer = makeImgButton(result, new android.view.View.OnClickListener({
    onClick: function(v) {
      imageViewerSetDialog();
    }
  }), null, null, false);
  imageViewerLayout.addView(imageViewer);

  setWindow(windows.imageViewerWindow, imageViewerLayout, (readData("image_viewer_width") == "" || readData("image_viewer_width") == "undefined") ? dip2px(100) : parseInt(readData("image_viewer_width")), (readData("image_viewer_height") == "" || readData("image_viewer_height") == "undefined") ? dip2px(100) : parseInt(readData("image_viewer_height")), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, (readData("image_viewer_x") == "" || readData("image_viewer_x") == "undefined") ? dip2px(2) : parseInt(readData("image_viewer_x")), (readData("image_viewer_y") == "" || readData("image_viewer_y") == "undefined") ? dip2px(4) : parseInt(readData("image_viewer_y"))]);

  setDragable(windows.imageViewerWindow, imageViewer, "image_viewer_x", "image_viewer_y", 0);
}


function imageViewerSetDialog() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var fileChoose = new android.widget.Button(ctx);
        fileChoose.setText("이미지 파일 선택");
        fileChoose.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        fileChoose.setOnClickListener(new android.view.View.OnClickListener({
          onClick: function(v) {
            if (windows.imageViewerWindow != null) closeWindow(windows.imageViewerWindow);
            makeFileChooser(SD_CARD);
          }
        }));
        layout.addView(fileChoose);

        var scaleText1 = new android.widget.TextView(ctx);
        scaleText1.setText(" 크기(가로) : " + parseInt(readData("image_viewer_width")));
        scaleText1.setTextSize(15);
        scaleText1.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        scaleText1.setGravity(android.view.Gravity.LEFT);
        layout.addView(scaleText1);

        var scaleChange1 = new android.widget.SeekBar(ctx);
        scaleChange1.setMax(1000);
        if (readData("image_viewer_width") < 1001)
          scaleChange1.setProgress(parseInt(readData("image_viewer_width")));
        scaleChange1.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
          onProgressChanged: function(s) {
            scaleText1.setText(" 크기(가로) : " + s.getProgress());
            saveData("image_viewer_width", s.getProgress());
          }
        }));
        layout.addView(scaleChange1);

        var scaleText2 = new android.widget.TextView(ctx);
        scaleText2.setText(" 크기(세로) : " + parseInt(readData("image_viewer_height")));
        scaleText2.setTextSize(15);
        scaleText2.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        scaleText2.setGravity(android.view.Gravity.LEFT);
        layout.addView(scaleText2);

        var scaleChange2 = new android.widget.SeekBar(ctx);
        scaleChange2.setMax(1000);
        if (readData("image_viewer_height") < 1001)
          scaleChange2.setProgress(parseInt(readData("image_viewer_height")));
        scaleChange2.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
          onProgressChanged: function(s) {
            scaleText2.setText(" 크기(세로) : " + s.getProgress());
            saveData("image_viewer_height", s.getProgress());
          }
        }));
        layout.addView(scaleChange2);

        var exit = new android.widget.Button(ctx);
        exit.setText("이미지뷰어 종료");
        exit.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        exit.setOnClickListener(new android.view.View.OnClickListener({
          onClick: function(v) {
            if (windows.imageViewerWindow != null) closeWindow(windows.imageViewerWindow);
          }
        }));
        layout.addView(exit);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("이미지 뷰어 설정");
        dialog.setView(layout);
        dialog.setNegativeButton("닫기", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            if (windows.imageViewerWindow != null) closeWindow(windows.imageViewerWindow);
            setWindow(windows.imageViewerWindow, imageViewerLayout, (readData("image_viewer_width") == "" || readData("image_viewer_width") == "undefined") ? dip2px(100) : parseInt(readData("image_viewer_width")), (readData("image_viewer_height") == "" || readData("image_viewer_height") == "undefined") ? dip2px(100) : parseInt(readData("image_viewer_height")), new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT), false, [ctx.getWindow().getDecorView(), android.view.Gravity.RIGHT | android.view.Gravity.TOP, (readData("image_viewer_x") == "" || readData("image_viewer_x") == "undefined") ? dip2px(2) : parseInt(readData("image_viewer_x")), (readData("image_viewer_y") == "" || readData("image_viewer_y") == "undefined") ? dip2px(4) : parseInt(readData("image_viewer_y"))]);
          }
        }));
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 12.option
 * Made by Irenebode
 * Since 171102
 */
var woodenAxeOnoff = true;
var WeCUIOnoff = true;
var btnInfoOnoff = true;
var nightVision = false;

function optionMain() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var btnsT = [];
        var menusT = ["나무도끼 사용", "월드에딧CUI 사용", "버튼설명 사용", "야간투시 사용"];
        var menusTon = ["나무도끼 사용 ON", "월드에딧CUI 사용 OFF", "버튼설명 사용 ON", "야간투시 사용 ON"];
        var menusToff = ["나무도끼 사용 OFF", "월드에딧CUI 사용 OFF", "버튼설명 사용 OFF", "야간투시 사용 OFF"];
        var bools = [woodenAxeOnoff, WeCUIOnoff, btnInfoOnoff, nightVision];

        for (var i in menusT) {
          btnsT[i] = new android.widget.ToggleButton(ctx);
          btnsT[i].setTextOn(menusTon[i]);
          btnsT[i].setTextOff(menusToff[i]);
          btnsT[i].setTextSize(15);
          btnsT[i].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
          btnsT[i].setId(i);
          btnsT[i].setChecked(bools[i]);
          btnsT[i].setTextColor(android.graphics.Color.BLACK);
          btnsT[i].setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.parseColor(colors[0])));
          btnsT[i].setLayoutParams(new android.widget.LinearLayout.LayoutParams(margin));
          btnsT[i].setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
            onCheckedChanged: function(toggle, onoff) {
              switch (toggle.getId()) {
                case 0:
                  if (onoff) woodenAxeOnoff = true;
                  else woodenAxeOnoff = false;
                  break;

                case 1:
                  toast("개발중인 기능입니다.");
                  break;

                case 2:
                  if (onoff) btnInfoOnoff = true;
                  else btnInfoOnoff = false;
                  break;

                case 3:
                  if (onoff) {
                    nightVision = true;
                    Entity.addEffect(getPlayerEnt(), MobEffect.nightVision, 10 * 999999999999, 3, true);
                  } else {
                    nightVision = false;
                    Entity.removeEffect(getPlayerEnt(), MobEffect.nightVision);
                  }
                  break;
              }
            }
          }));
          layout.addView(btnsT[i]);
        }

        var initializeBtn = new android.widget.Button(ctx);
        initializeBtn.setText("메인버튼 위치 초기화");
        initializeBtn.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        initializeBtn.setOnClickListener(new android.view.View.OnClickListener({
          onClick: function(v) {
            removeData("main_button_x");
            removeData("main_button_y");
            toast("메인버튼 위치를 초기화 하였습니다. 맵을 나갔다 들어와주세요.");
          }
        }));
        layout.addView(initializeBtn);

        var weExit = new android.widget.Button(ctx);
        weExit.setText("월드에딧 종료");
        weExit.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        weExit.setOnClickListener(new android.view.View.OnClickListener({
          onClick: function(v) {
            guiExit();
          }
        }));
        layout.addView(weExit);

        var scroll = android.widget.ScrollView(ctx);
        scroll.addView(layout);

        layout.setPadding(50, 50, 50, 50);

        dialog.setTitle("옵션");
        dialog.setView(scroll);
        dialog.setNegativeButton("닫기", null);
        dialog.show();

      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * Detail function of Num.2
 */

/**
 * 0.showPos
 * Made by Irenebode
 * Since 171106
 */
var posTxt;
var posBackground;

function showPos() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        posBackground = new android.widget.PopupWindow();
        posTxt = new android.widget.TextView(ctx);
        posTxt.setTextColor(android.graphics.Color.WHITE);
        posTxt.setTextSize(12);

        posBackground.setContentView(posTxt);
        posBackground.setWidth(-2);
        posBackground.setHeight(-2);
        posBackground.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.argb(100, 100, 100, 100)));
        posBackground.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.LEFT | android.view.Gravity.TOP, 120, 20);
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 1.showFocusInfo
 * Made by Irenebode
 * Since 171106
 */
var focusTxt;
var focusBackground;

function showFocusInfo() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        focusBackground = new android.widget.PopupWindow();
        focusTxt = new android.widget.TextView(ctx);
        focusTxt.setTextColor(android.graphics.Color.WHITE);
        focusTxt.setTextSize(12);

        focusBackground.setContentView(focusTxt);
        focusBackground.setWidth(-2);
        focusBackground.setHeight(-2);
        focusBackground.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.argb(100, 100, 100, 100)));
        focusBackground.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.LEFT | android.view.Gravity.TOP, 120, 60);
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 2.showItemInfo
 * Made by Irenebode
 * Since 171106
 */
var itemTxt;
var itemBackground;

function showItemInfo() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        itemBackground = new android.widget.PopupWindow();
        itemTxt = new android.widget.TextView(ctx);
        itemTxt.setTextColor(android.graphics.Color.WHITE);
        itemTxt.setTextSize(12);

        itemBackground.setContentView(itemTxt);
        itemBackground.setWidth(-2);
        itemBackground.setHeight(-2);
        itemBackground.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.argb(100, 100, 100, 100)));
        itemBackground.showAtLocation(ctx.getWindow().getDecorView(), android.view.Gravity.LEFT | android.view.Gravity.TOP, 120, 100);
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 8.buildHeightDialog & 9.buildDownDialog
 * Made by Irenebode
 * Since 171105
 */
function buildDialog() {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var editT = new android.widget.EditText(ctx);
        editT.setText("0");
        editT.setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        editT.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        layout.addView(editT);

        var scroll = android.widget.ScrollView(ctx);
        scroll.addView(layout);
        if (upBlock) dialog.setTitle("블럭 위로 쌓기");
        if (downBlock) dialog.setTitle("블럭 아래로 쌓기")
        dialog.setView(scroll);

        dialog.setNegativeButton("취소", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            if (upBlock) Height = editT.getText();
            else if (downBlock) Down = editT.getText();
          }
        }));
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}


/**
 * 10.signEditor
 * Made by Irenebode
 * Since 171105
 */
function signEditor(x, y, z) {
  ctx.runOnUiThread(new java.lang.Runnable({
    run: function() {
      try {
        var dialog = new android.app.AlertDialog.Builder(ctx, 5);
        var layout = new android.widget.LinearLayout(ctx);
        layout.setOrientation(1);

        var signText = [];
        for (var n = 0; n < 4; n++) {
          signText[n] = new android.widget.EditText(ctx);
          signText[n].setHint("표지판 " + (n + 1) + "번째 줄 내용");
          signText[n].setText(Level.getSignText(x, y, z, n));
          layout.addView(signText[n]);
          signText[n].setTypeface(new android.graphics.Typeface.createFromFile(NANUM_SQUARE_ROUND_L));
        }

        var scroll = new android.widget.ScrollView(ctx);
        scroll.addView(layout);
        dialog.setView(scroll);

        dialog.setNegativeButton("취소", null);
        dialog.setPositiveButton("확인", new android.content.DialogInterface.OnClickListener({
          onClick: function(v) {
            for (var n = 0; n < 4; n++) Level.setSignText(x, y, z, n, signText[n].getText().toString());
            toast("표지판 내용이 수정되었습니다.");
          }
        }));
        dialog.show();
      } catch (e) {
        clientMessage(e + ", " + e.lineNumber);
      }
    }
  }));
}



function initialize() {
  // 폴더 체크
  checkDirectories();

  // 파일 체크
  checkFiles();

  // 1.0 타이틀 이미지가 있다면 제거
  var file = new java.io.File(GUI_PATH + "/title.png");
  if (file.exists()) file.delete();

  // 1.1 타이틀 이미지가 있다면 제거
  var file2 = new java.io.File(GUI_PATH + "/title_1.1.png");
  if (file2.exists()) file2.delete();

  new java.lang.Thread(new java.lang.Runnable() {
    run: function() {
      try {
        if (checkFilesThread != null)
          checkFilesThread.join();

        if (isScriptable) { // 리소스 파일 존재
          // GUI 생성
          makeGUIWindow();
          if (makeGUIWindowThread != null)
            makeGUIWindowThread.join();

          // 버전 확인
          checkVer = true;

          // 이미지뷰어 이미지크기 초기설정
          saveData("image_viewer_width", 100);
          saveData("image_viewer_height", 100);
        }
      } catch (e) {
        toast("initialize 과정에서 오류가 발생하였습니다.\n" + e + ", " + e.lineNumber);
      }
    }
  }).start();
}
initialize();


/**
 * Copyright (C) 2017-2018 Irenebode All rights reserved.
 */
