import exist from 'exist.js'
import { PREFIX, TASK_DESCRIPTION, PLAN_TYPE_MAP, FLOW_TYPE_ALIPAY_MAP, FUND_SCHEDULE_STRATEGY_MAP, AUTO_FINANCE_FORM } from '../constants/flow'
import DeleteTask from './DeleteTask'
import IgnoreTask from './IgnoreTask'
import ConfirmTask from './ConfirmTask'
import { getBankNumber, changeToShowFormat } from './common/common'

const debug = require('debug')('mrchportalweb:home')
const Controller = require('chair').Controller
