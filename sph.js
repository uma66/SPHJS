
var canvas;
var ctx;

// 画面サイズ
var WINDOW_L_SIDE   = 7.5;
var WINDOW_R_SIDE   = 585;
var WINDOW_TOP      = WINDOW_L_SIDE;
var WINDOW_UNDER    = WINDOW_R_SIDE;
var DIMENSION       = 2;	// 2次元 or 3次元

var PARTICLES_NUM   = 300;	// 粒子数
var particles       = new Array(PARTICLES_NUM);
var PARTICLE_RADIUS = 4;	// 粒子の半径
var SCOPE_H         = 30;	// 近傍探索範囲

var polyCoef        = 0.0;	// poly6カーネル係数
var spikyCoef       = 0.0;	// Spikyカーネル係数
var MASS            = 0.04;

window.onload = function() {
    for (i = 0; i < particles.length; i++) {
       // 粒子オブジェクト生成
       this.particles[i] = {
    		x: 	    WINDOW_L_SIDE + Math.floor(Math.random() * WINDOW_R_SIDE),
    		y: 	    WINDOW_TOP + Math.floor(Math.random() * WINDOW_UNDER),
    		vx:     0,
    		vy:     0,
    		radius: PARTICLE_RADIUS,
    		dens:   0.0,	// 密度 
    		press: 	0.0,	// 圧力
    	};
    }

    // カーネル係数
    polyCoef  = calcKernelCoefPoly6(2, 1);	// (2=>2次元, 1=>関数値)
    spikyCoef = calcKernelCoefSpiky(2, 2);  // (2=>2次元, 2=>勾配値)

    for (i = 0; i < particles.length; i++) {
    	var p = particles[i];
    	// 密度
    	var density = calcDensity(p);
    	// 圧力/(密度*密度)
    	var prsi_i = p.press/(p.dens*p.dens);
    	// 圧力
    	var press = calcPressure(p, prsi_i);
    	// 自圧力 = -Σ　他質量 * (自圧力+他圧力)/他密度*2 * カーネル
    }
}

// 2点間の粒子の距離を返す
function calcDistance(p1, p2) {
    var x = p1.x - p2.x;
    var y = p1.y - p2.y;
    return Math.sqrt(x*x + y*y);
}

// 密度計算
function calcDensity(particle) {
    var density = 0.0;
    for (i = 0; i < particles.length; i++) {
    	var dist = calcDistance(particle, particles[i]);
    	// 密度 += 質量 * poly6カーネル関数値
    	density += MASS * calcPoly6Func(dist, polyCoef);
    }
    return density;
}

/**
 * 圧力計算
*/
function calcPressure(particle, prsi_i) {
    var retPress = 0.0;
    for (i = 0; i < particles.length; i++) {
    	var p = particles[i];
    	var prsi_j = p.press/(p.dens*p.dens);
    	var dist = calcDistance(particle, particles[i]);
    	retPress += MASS * calcSpikyGrad(dist, spikyCoef, rij);
    }
    return press;
}

//-----------------------------------------------------------------------------
// Poly6カーネル
//-----------------------------------------------------------------------------

/**
 * カーネル係数計算
 * @param 	{number} d 				2:2次元 3:3次元
 * @param 	{number} type			1:ノーマル 2:勾配 3:ラプラシアン
 * @return 	{number} カーネル係数値
*/
function calcKernelCoefPoly6(d, type) {
    var coefNum = 1.0;
    switch(type) {
      case 1: // ノーマル
        switch(DIMENSION) {
          case 2: coefNum = 4.0/( Math.PI * Math.pow(SCOPE_H, 8) );			break;
          case 3: coefNum = 315.0/( 64.0 * Math.PI * Math.pow(SCOPE_H, 9) ); 	break;
        }
    		break;
      case 2: // 勾配
        switch(DIMENSION) {
          case 2: coefNum = -24.0/( Math.PI * Math.pow(SCOPE_H, 8) );			break;
          case 3: coefNum = -945.0/( 32.0 * Math.PI * Math.pow(SCOPE_H, 9) ); break;
        }
        break;
      case 3: // ラプラシアン
        switch(DIMENSION) {
          case 2: coefNum = -24.0/( Math.PI * Math.pow(SCOPE_H, 8) );			break;
          case 3: coefNum = -945.0/( 32.0 * Math.PI * Math.pow(SCOPE_H, 9) ); break;
        }
        break;
      default:
        break;
    }
    return coefNum;
}

/**
 * Poly6カーネル関数値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} poly6関数値
*/
function calcPoly6Func(dist, coefNum) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = SCOPE_H*SCOPE_H-dist*dist;	
        return coefNum*q*q*q;
    } else {
        return 0.0;
    }
}

/**
 * Poly6カーネル関数勾配値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @param 	{vec3}   rij			相対位置ベクトル
 * @return 	{vec3} 	 poly6勾配値
*/
function calcPoly6Grad(dist, coefNum, rij) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = SCOPE_H*SCOPE_H-dist*dist;	
        return coefNum*q*q*rij;
    } else {
    	//var v = {x:0.0, y:0.0, z:0.0};
        return 0.0;
    }
}

/**
 * Poly6カーネル関数ラプラシアンの計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} poly6ラプラシアン値
*/
function calcPoly6Lap(dist, coefNum) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = SCOPE_H*SCOPE_H-dist*dist;	
        return coefNum*(3.0*q*q*-4*dist*dist*q);
    } else {
        return 0.0;
    }
}

//-----------------------------------------------------------------------------
// Spikyカーネル
//-----------------------------------------------------------------------------

/**
 * カーネル係数計算
 * @param 	{number} d 				2:2次元 3:3次元
 * @param 	{number} type			1:ノーマル 2:勾配 3:ラプラシアン
 * @return 	{number} カーネル係数値
*/
function calcKernelCoefSpiky(d, type) {
    var coefNum = 1.0;
    switch(type) {
        case 1: // ノーマル
            switch(DIMENSION) {
                case 2: coefNum = 10.0/( Math.PI * Math.pow(SCOPE_H, 5) );	break;
                case 3: coefNum = 15.0/( Math.PI * Math.pow(SCOPE_H, 6) ); 	break;
            }
            break;
        case 2: // 勾配
            switch(DIMENSION) {
                case 2: coefNum = -30.0/( Math.PI * Math.pow(SCOPE_H, 5) );	break;
                case 3: coefNum = -45.0/( Math.PI * Math.pow(SCOPE_H, 6) );	break;
            }
            break;
        case 3: // ラプラシアン
            switch(DIMENSION) {
                case 2: coefNum = -60.0/( Math.PI * Math.pow(SCOPE_H, 5) ); break;
                case 3: coefNum = -90.0/( Math.PI * Math.pow(SCOPE_H, 6) ); break;
            }
            break;
        default:
          break;
    }
    return coefNum;
}

/**
 * Spikyカーネル関数値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} Spiky関数値
*/
function calcSpikyFunc(dist, coefNum) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = SCOPE_H-dist;	
        return coefNum*q*q*q;
    } else {
        return 0.0;
    }
}

/**
 * Spikyカーネル関数勾配値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @param 	{vec3}   rij			相対位置ベクトル
 * @return 	{number} Spiky勾配値
*/
function calcSpikyGrad(dist, coefNum, rij) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = SCOPE_H-dist;	
        return coefNum*q*q*rij/dist;
    } else {
        return 0.0;
    }
}

/**
 * Spikyカーネル関数ラプラシアンの計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} Spikyラプラシアン値
*/
function calcSpikyLap(dist, coefNum) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = SCOPE_H-dist;	
        return coefNum*(q*q/dist-q);
    } else {
        return 0.0;
    }
}

//-----------------------------------------------------------------------------
// Viscカーネル
//-----------------------------------------------------------------------------

/**
 * カーネル係数計算
 * @param 	{number} d 				2:2次元 3:3次元
 * @param 	{number} type			1:ノーマル 2:勾配 3:ラプラシアン
 * @return 	{number} カーネル係数値
*/
function calcKernelCoefVisc(d, type) {
    var coefNum = 1.0;
    switch(type) {
        case 1: // ノーマル
            switch(DIMENSION) {
                case 2: coefNum = 10.0/( 3.0*Math.PI * Math.pow(SCOPE_H, 2) );	break;
                case 3: coefNum = 15.0/( 2.0*Math.PI * Math.pow(SCOPE_H, 3) ); 	break;
            }
            break;
        case 2: // 勾配
            switch(DIMENSION) {
                case 2: coefNum = 10.0/( 3.0*Math.PI * Math.pow(SCOPE_H, 4) );	break;
                case 3: coefNum = 15.0/( 2.0*Math.PI * Math.pow(SCOPE_H, 5) );	break;
            }
            break;
        case 3: // ラプラシアン
            switch(DIMENSION) {
                case 2: coefNum = 20.0/( 3.0*Math.PI * Math.pow(SCOPE_H, 5) ); break;
                case 3: coefNum = 45.0/( Math.PI * Math.pow(SCOPE_H, 6) ); 	   break;
            }
            break;
        default:
            break;
    }
    return coefNum;
}

/**
 * Viscカーネル関数値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} Visc関数値
*/
function calcViscFunc(dist, coefNum) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = dist/SCOPE_H;
        return coefNum*(-q*q*q/2+q*q+2/q-1);
    } else {
        return 0.0;
    }
}

/**
 * Viscカーネル関数勾配値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @param 	{vec3}   rij			相対位置ベクトル
 * @return 	{number} Visc勾配値
*/
function calcViscGrad(dist, coefNum, rij) {
    if (dist >= 0.0 && dist < SCOPE_H) {
        var q = dist/SCOPE_H;	
        return coefNum*(-1.5/q+2-q*q*q/2)*rij;
    } else {
        return 0.0;
    }
}

/**
 * Viscカーネル関数ラプラシアンの計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} Viscラプラシアン値
*/
function calcViscLap(dist, coefNum) {
    if (dist >= 0.0 && dist < SCOPE_H) {	
        return coefNum*(SCOPE_H-dist);
    } else {
        return 0.0;
    }
}

//-----------------------------------------------------------------------------
// Splineカーネル
//-----------------------------------------------------------------------------

/**
 * カーネル係数計算
 * @param 	{number} d 				2:2次元 3:3次元
 * @param 	{number} type			1:ノーマル 2:勾配 3:ラプラシアン
 * @return 	{number} カーネル係数値
*/
function calcKernelCoefSpline(d, type) {
    var coefNum = 1.0;
    switch(type) {
        case 1: // ノーマル
            switch(DIMENSION) {
            		case 1: coefNum = 2/( 3*SCOPE_H );                        break;
            		case 2: coefNum = 10/( 7.0*Math.PI * SCOPE_H*SCOPE_H );   break;
            		case 3: coefNum = 1/( Math.PI * Math.pow(SCOPE_H, 3) );   break;
          	}
        	break;
        case 2: // 勾配
            switch(DIMENSION) {
              	case 1: coefNum = 3/( 2*Math.pow(SCOPE_H, 3) );              break;
              	case 2: coefNum = 45/( 14*Math.PI * Math.pow(SCOPE_H, 4) );  break;
              	case 3: coefNum = 9/( 4*Math.PI * Math.pow(SCOPE_H, 5) );    break;
            }
          break;
        case 3: // ラプラシアン
            switch(DIMENSION) {
              	case 1: coefNum = 1/( 2*Math.PI * Math.pow(SCOPE_H, 3) );	   break;	
              	case 2: coefNum = 45/( 42*Math.PI * Math.pow(SCOPE_H, 4) );  break;
              	case 3: coefNum = 3/( 4*Math.PI * Math.pow(SCOPE_H, 5) );    break;
            }
            break;
        default:
            break;
    }
    return coefNum;
}

/**
 * Splineカーネル関数値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @return 	{number} Spline関数値
*/
function calcSplineFunc(dist, coefNum) {
    var q = dist/SCOPE_H;
    if (q >= 0.0 && q < 1.0) {
        return coefNum*(1.0-1.5*q*q+0.75*Math.pow(q, 3));
    } else if (q >= 1.0 && q < 2.0) {
        return coefNum*0.25*(2.0-q)*(2.0-q)*(2.0-q);
    } else {
        return 0.0;
    }
}

/**
 * Splineカーネル関数勾配値の計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @param 	{vec3}   rij			相対位置ベクトル
 * @return 	{number} Spline勾配値
*/
function calcSplineGrad(dist, coefNum, rij) {
    var q = dist/SCOPE_H;
    if (q >= 0.0 && q < 1.0) {
        return coefNum*(q-4.0/3.0)*rij;
    } else if (q >= 1.0 && q < 2.0) {
        return -coefNum*(2.0-q)*(2.0-q)*rij/q/3.0;
    } else {
        return 0.0;
    }
}

/**
 * Splineカーネル関数ラプラシアンの計算
 * @param 	{number} dist 			粒子間の距離
 * @param 	{number} coefNum		カーネル係数
 * @param 	{number} d				1:1次元 2:2次元 3:3次元
 * @return 	{number} Splineラプラシアン値
*/
function calcSplineLap(dist, coefNum, d) {
    var q = dist/SCOPE_H;
    if (q >= 0.0 && q < 1.0) {
        return coefNum*(3.0*(d+1.0)*q-4.0*d);
    } else if (q >= 1.0 && q < 2.0) {
        return coefNum*( (1.0-d)*(2.0-q)*(2.0-q)/q+2.0*(2.0-q) );
    } else {
        return 0.0;
    }
}
